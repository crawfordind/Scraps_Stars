import { readFile } from "fs/promises";
import path from "path";
import type { PantryProfile } from "@/lib/coach/types";
import type { CoachTrigger } from "@/lib/coach/types";
import { getChefById } from "@/lib/chefs/personas";
import {
  coachBriefingLlmSchema,
  inventoryExtractionSchema,
  recipeSchema,
  type CoachBriefingLlm,
  type InventoryExtractionOutput,
  type LlmRequestMeta,
  type RecipeOutput,
  type Tier,
} from "./types";
import {
  ModelJsonParseError,
  normalizeInventoryJson,
  normalizeRecipeJson,
  parseModelJson,
} from "./normalize";
import { getModelRouting, TASK_MAX_TOKENS } from "./modelRouting";
import {
  TASK_RESPONSE_SCHEMA,
  structuredOutputsEnabled,
  type JsonSchemaResponseFormat,
} from "./responseSchemas";
import { compressImageBuffer } from "../images/compressForVision";
import { estimateRequestCost } from "../telemetry/costEstimator";
import { logOptimizationAudit } from "../telemetry/optimizationAudit";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";

type TaskKind = "inventory_extract" | "recipe_generate" | "recipe_revise" | "coach_briefing";

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ChatMessage = {
  role: "system" | "user";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

type LlmResult<T> = {
  data: T;
  meta: LlmRequestMeta;
};

type ResponseFormat = { type: "json_object" } | JsonSchemaResponseFormat;

type Attempt = {
  responseFormat: ResponseFormat;
  messages: ChatMessage[];
  requireParameters: boolean;
  // "schema" attempts may fail simply because the provider lacks structured-output
  // support — those degrade to a plain json attempt on the SAME model rather than
  // failing straight over to the fallback model.
  kind: "schema" | "json";
};

class LlmApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmApiError";
  }
}

const STRICT_JSON_SUFFIX =
  " Return ONLY valid JSON with no markdown fences, comments, or extra text. Escape double quotes inside string values with backslash.";

function isJsonParseFailure(err: unknown): boolean {
  return (
    err instanceof ModelJsonParseError ||
    err instanceof SyntaxError ||
    (err instanceof Error && /JSON|parse/i.test(err.message))
  );
}

function withStrictJsonPrompt(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (message.role !== "system" || typeof message.content !== "string") {
      return message;
    }
    if (message.content.includes(STRICT_JSON_SUFFIX)) {
      return message;
    }
    return { ...message, content: message.content + STRICT_JSON_SUFFIX };
  });
}

function getHeaders(): HeadersInit {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_TITLE ?? "Barefeast",
    "Content-Type": "application/json",
  };
}

async function loadImageBytes(imageUrl: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
  }

  try {
    const url = new URL(imageUrl);
    const localMatch = url.pathname.match(/\/debug-storage\/([^/]+)$/);
    if (
      localMatch &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1")
    ) {
      const filePath = path.join(process.cwd(), "public", "debug-storage", localMatch[1]);
      const buffer = await readFile(filePath);
      const ext = path.extname(localMatch[1]).toLowerCase();
      const mime =
        ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
      return { buffer, mime };
    }
  } catch {
    // fall through to fetch
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) return null;
  const mime = imageRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  return { buffer, mime };
}

async function buildInventoryMessages(
  imageUrl: string,
  systemPrompt: string,
): Promise<ChatMessage[]> {
  const userParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: "List visible food and spices." },
  ];

  try {
    const loaded = await loadImageBytes(imageUrl);
    if (loaded) {
      const { buffer, mime } = await compressImageBuffer(loaded.buffer, loaded.mime);
      userParts.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${buffer.toString("base64")}` },
      });
    } else {
      userParts[0].text += ` URL:${imageUrl}`;
    }
  } catch {
    userParts[0].text += ` URL:${imageUrl}`;
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userParts },
  ];
}

async function invokeOpenRouterJson<T>(args: {
  task: TaskKind;
  systemPrompt: string;
  userPrompt: string;
  messages?: ChatMessage[];
  parse: (json: unknown) => T;
  temperature?: number;
}): Promise<LlmResult<T>> {
  const { primary, fallback } = getModelRouting(args.task);
  const baseMessages =
    args.messages ??
    ([
      { role: "system", content: args.systemPrompt },
      { role: "user", content: args.userPrompt },
    ] as ChatMessage[]);

  const models: Array<{ model: string; fallbackUsed: boolean }> =
    primary === fallback
      ? [{ model: primary, fallbackUsed: false }]
      : [
          { model: primary, fallbackUsed: false },
          { model: fallback, fallbackUsed: true },
        ];

  const callOnce = async (
    model: string,
    fallbackUsed: boolean,
    requestMessages: ChatMessage[],
    responseFormat: ResponseFormat,
    requireParameters: boolean,
  ): Promise<LlmResult<T>> => {
    const start = Date.now();
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model,
        response_format: responseFormat,
        // Only route to providers that actually support the schema, so an
        // unsupported provider errors fast and we degrade cleanly to json_object.
        provider: requireParameters ? { require_parameters: true } : undefined,
        temperature: args.temperature ?? 0.2,
        max_tokens: TASK_MAX_TOKENS[args.task],
        messages: requestMessages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new LlmApiError(`OpenRouter request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: OpenRouterUsage;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new LlmApiError("OpenRouter returned empty response content");
    }

    const parsed = args.parse(parseModelJson(content));
    const latencyMs = Date.now() - start;
    const cost = estimateRequestCost({
      model,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    });

    logOptimizationAudit({
      task: args.task,
      model,
      latencyMs,
      fallbackUsed,
      ok: true,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
      estimatedCostUsd: cost.estimatedCostUsd,
    });

    return {
      data: parsed,
      meta: {
        model,
        latencyMs,
        fallbackUsed,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
        estimatedCostUsd: cost.estimatedCostUsd,
      },
    };
  };

  // Per model, try strongest → safest: provider-enforced schema, then plain
  // json, then json with an explicit "JSON only" nudge for stubborn models.
  const attempts: Attempt[] = [];
  if (structuredOutputsEnabled()) {
    attempts.push({
      responseFormat: TASK_RESPONSE_SCHEMA[args.task],
      messages: baseMessages,
      requireParameters: true,
      kind: "schema",
    });
  }
  attempts.push({
    responseFormat: { type: "json_object" },
    messages: baseMessages,
    requireParameters: false,
    kind: "json",
  });
  attempts.push({
    responseFormat: { type: "json_object" },
    messages: withStrictJsonPrompt(baseMessages),
    requireParameters: false,
    kind: "json",
  });

  let lastApiError: LlmApiError | undefined;
  let lastParseError: ModelJsonParseError | undefined;

  for (const { model, fallbackUsed } of models) {
    for (const attempt of attempts) {
      try {
        return await callOnce(
          model,
          fallbackUsed,
          attempt.messages,
          attempt.responseFormat,
          attempt.requireParameters,
        );
      } catch (err) {
        if (err instanceof LlmApiError) {
          lastApiError = err;
          // A schema attempt can fail purely because the provider doesn't
          // support structured outputs — degrade to json on the same model.
          if (attempt.kind === "schema") continue;
          // A plain-json API error is a real upstream problem: fail over.
          break;
        }

        if (isJsonParseFailure(err)) {
          lastParseError =
            err instanceof ModelJsonParseError
              ? err
              : new ModelJsonParseError(
                  "We couldn't read the scan results. Please try again with a clearer photo or fewer items in frame.",
                );
          continue;
        }

        throw err;
      }
    }
  }

  if (lastParseError) {
    logOptimizationAudit({
      task: args.task,
      model: models.map((entry) => entry.model).join(" -> "),
      latencyMs: 0,
      fallbackUsed: models.length > 1,
      ok: false,
      error: lastParseError.message,
    });
    throw lastParseError;
  }

  if (lastApiError) {
    logOptimizationAudit({
      task: args.task,
      model: models.map((entry) => entry.model).join(" -> "),
      latencyMs: 0,
      fallbackUsed: models.length > 1,
      ok: false,
      error: lastApiError.message,
    });
    throw lastApiError;
  }

  throw new ModelJsonParseError();
}

export async function generateRecipe(input: {
  inventoryList: string[];
  preferences: string[];
  tier: Tier;
  chefId?: string;
  flavorHints?: string[];
}): Promise<LlmResult<RecipeOutput>> {
  const chef = getChefById(input.chefId ?? "bottura");
  const personaLine = chef?.promptFragment ?? "You are a zero-waste chef.";
  const hintsLine =
    input.flavorHints && input.flavorHints.length > 0
      ? ` User enjoys: ${input.flavorHints.join("; ")}.`
      : "";

  const systemPrompt =
    `${personaLine}${hintsLine} Return a single JSON object. difficulty must be exactly "Beginner", "Intermediate", or "Master". Tier1: empty shopping_list, use only PANTRY items. Tier2: max 3 shopping items. Tier3: full shopping list allowed. Never use any item listed in EXCLUDE. ingredients_pantry must only contain items from PANTRY. steps: 4–8 actions, one clear sentence each, in order. flavor_profile_explanation: one sentence. estimated_time_minutes: realistic integer. xp_reward: integer 10–50. chef_commentary: 2 sentences in your persona voice. chef_waste_tip: 1 practical waste-reduction tip. Keys: recipe_name, flavor_profile_explanation, estimated_time_minutes, difficulty, ingredients_pantry, ingredients_shopping_list, steps, xp_reward, chef_commentary, chef_waste_tip`;

  const userPrompt = `TIER:${input.tier} EXCLUDE:${JSON.stringify(input.preferences)} PANTRY:${JSON.stringify(input.inventoryList)}`;

  return invokeOpenRouterJson({
    task: "recipe_generate",
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    parse: (json) => recipeSchema.parse(normalizeRecipeJson(json)),
  });
}

export async function reviseRecipe(input: {
  originalRecipe: RecipeOutput;
  gripe: string;
  chefId?: string;
}): Promise<LlmResult<RecipeOutput>> {
  const chef = getChefById(input.chefId ?? "bottura");
  const personaLine = chef?.promptFragment ?? "You are a zero-waste chef.";
  const systemPrompt =
    `${personaLine} Revise the recipe based on user feedback. Return a single JSON object with the same keys as the original. Keep pantry constraints. difficulty must be exactly "Beginner", "Intermediate", or "Master". Keys: recipe_name, flavor_profile_explanation, estimated_time_minutes, difficulty, ingredients_pantry, ingredients_shopping_list, steps, xp_reward, chef_commentary, chef_waste_tip`;

  const userPrompt = JSON.stringify({
    feedback: input.gripe.slice(0, 500),
    original: input.originalRecipe,
  });

  return invokeOpenRouterJson({
    task: "recipe_revise",
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    parse: (json) => recipeSchema.parse(normalizeRecipeJson(json)),
  });
}

function normalizeCoachBriefingJson(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const o = json as Record<string, unknown>;
  return {
    greeting: String(o.greeting ?? o.greet ?? ""),
    personalized_hook: String(o.personalized_hook ?? o.hook ?? o.personalizedHook ?? ""),
    next_best_action: String(o.next_best_action ?? o.nextAction ?? o.action ?? ""),
    food_security_tip: String(o.food_security_tip ?? o.securityTip ?? o.tip ?? ""),
    fun_challenge: String(o.fun_challenge ?? o.challenge ?? ""),
    score_label: String(o.score_label ?? o.scoreLabel ?? "Building Momentum"),
  };
}

export async function generateCoachBriefing(input: {
  userName: string;
  level: number;
  foodSecurityScore: number;
  pantryProfile: PantryProfile;
  mealsSaved: number;
  favoriteChefId: string | null;
  trigger: CoachTrigger;
}): Promise<LlmResult<CoachBriefingLlm>> {
  const chef = input.favoriteChefId ? getChefById(input.favoriteChefId) : null;
  const systemPrompt =
    'You are a warm, concise kitchen coach focused on food security and zero waste. Return JSON only. Keys: greeting, personalized_hook, next_best_action, food_security_tip, fun_challenge, score_label. Max 2 short sentences per field. Be specific to user data. Fun but helpful. No markdown.';

  const userPrompt = JSON.stringify({
    trigger: input.trigger,
    userName: input.userName,
    level: input.level,
    foodSecurityScore: input.foodSecurityScore,
    mealsSaved: input.mealsSaved,
    chef: chef?.name ?? null,
    staples: input.pantryProfile.staples,
    recentScan: input.pantryProfile.recentScanIngredients,
    tierHabit: input.pantryProfile.tierHabit,
  });

  return invokeOpenRouterJson({
    task: "coach_briefing",
    systemPrompt,
    userPrompt,
    temperature: 0.5,
    parse: (json) => coachBriefingLlmSchema.parse(normalizeCoachBriefingJson(json)),
  });
}

export async function extractInventoryFromImage(input: {
  imageUrl: string;
}): Promise<LlmResult<InventoryExtractionOutput>> {
  const systemPrompt =
    "You identify edible items in a kitchen photo. Only real food, drinks, and seasonings — ignore packaging text, brand names, utensils, and non-edible objects. Use the common singular name (e.g. 'egg', not a brand). Merge duplicates into one entry. List at most 25 items, most prominent first. isSpice = true for spices and dried herbs. confidence (0-1) reflects how clearly you could read the photo — use a low value for blurry, dark, or near-empty shots, and return an empty ingredients array if you genuinely see no food. Return one JSON object with keys: ingredients (array of {ingredientName, quantity or null, isSpice}) and confidence.";

  const messages = await buildInventoryMessages(input.imageUrl, systemPrompt);

  return invokeOpenRouterJson({
    task: "inventory_extract",
    systemPrompt,
    userPrompt: "",
    messages,
    temperature: 0.1,
    parse: (json) => inventoryExtractionSchema.parse(normalizeInventoryJson(json)),
  });
}
