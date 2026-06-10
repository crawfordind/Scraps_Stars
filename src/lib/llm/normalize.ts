type Difficulty = "Beginner" | "Intermediate" | "Master";

export class ModelJsonParseError extends Error {
  constructor(message = "We couldn't read the AI response. Please try again.") {
    super(message);
    this.name = "ModelJsonParseError";
  }
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function extractJsonBlob(text: string): string {
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  let start = -1;

  if (objStart >= 0 && (arrStart < 0 || objStart <= arrStart)) {
    start = objStart;
  } else if (arrStart >= 0) {
    start = arrStart;
  }

  return start >= 0 ? text.slice(start).trim() : text.trim();
}

function repairTruncatedJson(text: string): string {
  let result = text.trim().replace(/,\s*$/, "");
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < result.length; i++) {
    const ch = result[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack.length > 0 && stack[stack.length - 1] === ch) {
      stack.pop();
    }
  }

  if (inString) {
    result += '"';
  }

  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}

function buildJsonCandidates(content: string): string[] {
  const trimmed = content.trim();
  const defenced = stripMarkdownFences(trimmed);
  const blob = extractJsonBlob(defenced);

  const candidates = [trimmed, defenced, blob, extractJsonBlob(trimmed)];
  return [...new Set(candidates.filter(Boolean))];
}

function tryParseCandidate(candidate: string): unknown | undefined {
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      return JSON.parse(repairTruncatedJson(candidate));
    } catch {
      return undefined;
    }
  }
}

export function parseModelJson(content: string): unknown {
  if (!content.trim()) {
    throw new ModelJsonParseError("The scan returned an empty response. Please try again.");
  }

  for (const candidate of buildJsonCandidates(content)) {
    const parsed = tryParseCandidate(candidate);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  throw new ModelJsonParseError(
    "We couldn't read the scan results. Please try again with a clearer photo or fewer items in frame.",
  );
}

export function normalizeDifficulty(val: unknown): Difficulty {
  const s = String(val ?? "").toLowerCase();
  if (/master|expert|advanced|hard|difficult/.test(s)) return "Master";
  if (/intermediate|medium|moderate/.test(s)) return "Intermediate";
  return "Beginner";
}

export function coerceStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => String(item)).filter(Boolean);
}

export function coerceInt(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function asString(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (val == null) return fallback;
  return String(val);
}

export function normalizeRecipeJson(json: unknown): unknown {
  let obj = json;
  if (Array.isArray(json)) {
    obj = json.find((item) => item && typeof item === "object") ?? json[0];
  }
  if (!obj || typeof obj !== "object") return json;

  const o = obj as Record<string, unknown>;
  return {
    recipe_name: asString(o.recipe_name ?? o.recipeName ?? o.name ?? o.title),
    flavor_profile_explanation: asString(
      o.flavor_profile_explanation ?? o.flavorProfile ?? o.description ?? o.summary,
    ),
    estimated_time_minutes: coerceInt(o.estimated_time_minutes ?? o.estimatedTimeMinutes ?? o.time, 30),
    difficulty: normalizeDifficulty(o.difficulty),
    ingredients_pantry: coerceStringArray(o.ingredients_pantry ?? o.ingredientsPantry ?? o.pantry),
    ingredients_shopping_list: coerceStringArray(
      o.ingredients_shopping_list ?? o.shopping_list ?? o.shoppingList,
    ),
    steps: (() => {
      const steps = coerceStringArray(o.steps);
      return steps.length > 0 ? steps : ["Prepare and cook using listed ingredients."];
    })(),
    xp_reward: coerceInt(o.xp_reward ?? o.xpReward ?? o.xp, 10),
    chef_commentary: (() => {
      const v = asString(o.chef_commentary ?? o.chefCommentary ?? o.commentary, "");
      return v || undefined;
    })(),
    chef_waste_tip: (() => {
      const v = asString(o.chef_waste_tip ?? o.chefWasteTip ?? o.waste_tip, "");
      return v || undefined;
    })(),
  };
}

type NormalizedIngredient = { ingredientName: string; quantity?: string; isSpice: boolean };

// Deterministic dedup so the ingredient list is always clean regardless of how
// well the model followed the "merge duplicates" instruction. Case-insensitive
// match on name; keeps the first quantity seen and ORs the spice flag.
function dedupeIngredients(items: NormalizedIngredient[]): NormalizedIngredient[] {
  const seen = new Map<string, NormalizedIngredient>();
  for (const item of items) {
    const key = item.ingredientName.trim().toLowerCase();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...item });
    } else {
      if (!existing.quantity && item.quantity) existing.quantity = item.quantity;
      existing.isSpice = existing.isSpice || item.isSpice;
    }
  }
  return [...seen.values()];
}

function normalizeIngredient(item: unknown) {
  if (typeof item === "string") {
    return { ingredientName: item, isSpice: false };
  }
  if (!item || typeof item !== "object") {
    return { ingredientName: "", isSpice: false };
  }
  const i = item as Record<string, unknown>;
  return {
    ingredientName: asString(i.ingredientName ?? i.ingredient_name ?? i.name),
    quantity: i.quantity != null ? asString(i.quantity) : undefined,
    isSpice: Boolean(i.isSpice ?? i.is_spice ?? false),
  };
}

export function normalizeInventoryJson(json: unknown): unknown {
  if (Array.isArray(json)) {
    return {
      ingredients: dedupeIngredients(json.map(normalizeIngredient).filter((i) => i.ingredientName)),
      confidence: 0.8,
    };
  }
  if (!json || typeof json !== "object") return json;

  const o = json as Record<string, unknown>;
  const raw = o.ingredients ?? o.items ?? o.inventory ?? o.foods;
  if (!Array.isArray(raw)) return json;

  return {
    ingredients: dedupeIngredients(raw.map(normalizeIngredient).filter((i) => i.ingredientName)),
    confidence: typeof o.confidence === "number" ? o.confidence : undefined,
  };
}
