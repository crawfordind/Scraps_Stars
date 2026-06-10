import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { CHEF_PERSONAS } from "../src/lib/chefs/personas";

const OPENROUTER_URL =
  process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash-image";

function getHeaders(): HeadersInit {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing");
  return {
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_TITLE ?? "Barefeast",
    "Content-Type": "application/json",
  };
}

type ImagePayload = { mime: string; base64: string };

function extractImageFromMessage(message: Record<string, unknown>): ImagePayload | null {
  const images = message.images as Array<{ image_url?: { url?: string }; imageUrl?: { url?: string } }> | undefined;
  if (images?.length) {
    const url = images[0].image_url?.url ?? images[0].imageUrl?.url;
    if (url) return parseDataUrl(url);
  }

  const content = message.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const p = part as Record<string, unknown>;
      if (p.type === "image_url" && p.image_url && typeof p.image_url === "object") {
        const url = (p.image_url as { url?: string }).url;
        if (url) return parseDataUrl(url);
      }
      if (p.type === "output_image" && typeof p.data === "string") {
        return { mime: "image/png", base64: p.data };
      }
    }
  }

  if (typeof content === "string" && content.startsWith("data:image")) {
    return parseDataUrl(content);
  }

  return null;
}

function parseDataUrl(dataUrl: string): ImagePayload | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

async function generatePortrait(prompt: string): Promise<Buffer> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image"],
      image_config: { aspect_ratio: "1:1" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter image failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: Record<string, unknown> }>;
  };

  const message = data.choices?.[0]?.message;
  if (!message) throw new Error("No message in image response");

  const image = extractImageFromMessage(message);
  if (!image) throw new Error("No image found in response");

  const raw = Buffer.from(image.base64, "base64");
  return sharp(raw).webp({ quality: 88 }).toBuffer();
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "chefs");
  await mkdir(outDir, { recursive: true });

  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  const chefs = only ? CHEF_PERSONAS.filter((c) => c.id === only) : CHEF_PERSONAS;

  if (chefs.length === 0) {
    throw new Error(`No chef matched --only=${only}`);
  }

  for (const chef of chefs) {
    const outPath = path.join(outDir, `${chef.id}.webp`);
    console.log(`Generating ${chef.name} (${chef.id})…`);
    const buffer = await generatePortrait(chef.portraitPrompt);
    await writeFile(outPath, buffer);
    console.log(`  → ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
