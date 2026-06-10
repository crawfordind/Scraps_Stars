import { readFile } from "fs/promises";
import path from "path";
import { extractInventoryFromImage } from "../src/lib/llm/openrouter";
import { compressImageBuffer } from "../src/lib/images/compressForVision";

const IMAGE_PATH =
  process.argv[2] ??
  "C:\\Users\\Daniel\\.cursor\\projects\\c-Users-Daniel-Projects-Scraps-Stars\\assets\\c__Users_Daniel_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_fridge-70a96e5c-5abc-4a5b-831e-1a73f847efc0.png";

async function main() {
  const raw = await readFile(IMAGE_PATH);
  const { buffer, mime } = await compressImageBuffer(raw, "image/png");
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  console.log("Image size after compress:", buffer.length, "bytes");
  console.log("Testing inventory extraction...\n");

  const result = await extractInventoryFromImage({ imageUrl: dataUrl });
  console.log("Success! Ingredients:", result.data.ingredients.length);
  console.log(JSON.stringify(result.data, null, 2));
  console.log("\nMeta:", result.meta);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
