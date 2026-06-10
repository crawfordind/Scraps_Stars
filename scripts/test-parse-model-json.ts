import {
  ModelJsonParseError,
  normalizeInventoryJson,
  parseModelJson,
} from "../src/lib/llm/normalize";
import { inventoryExtractionSchema } from "../src/lib/llm/types";

function assert(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`, err);
    process.exitCode = 1;
  }
}

assert("parses plain JSON", () => {
  const parsed = parseModelJson('{"ingredients":[{"ingredientName":"eggs","isSpice":false}]}');
  inventoryExtractionSchema.parse(normalizeInventoryJson(parsed));
});

assert("parses fenced JSON", () => {
  const parsed = parseModelJson(
    '```json\n{"ingredients":[{"ingredientName":"milk","isSpice":false}]}\n```',
  );
  inventoryExtractionSchema.parse(normalizeInventoryJson(parsed));
});

assert("repairs truncated inventory JSON", () => {
  const truncated =
    '{"ingredients":[{"ingredientName":"chicken","isSpice":false},{"ingredientName":"12\\" sub rolls","isSpice":false},{"ingredientName":"spinach","isSpice":false},{"ingredientName":"tomato';
  const parsed = parseModelJson(truncated);
  const normalized = normalizeInventoryJson(parsed) as { ingredients: Array<{ ingredientName: string }> };
  if (normalized.ingredients.length < 2) {
    throw new Error(`Expected salvaged ingredients, got ${normalized.ingredients.length}`);
  }
});

assert("rejects empty content with friendly error", () => {
  try {
    parseModelJson("   ");
    throw new Error("Expected ModelJsonParseError");
  } catch (err) {
    if (!(err instanceof ModelJsonParseError)) throw err;
    if (!err.message.includes("empty")) throw new Error(`Unexpected message: ${err.message}`);
  }
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All parse-model-json tests passed.");
