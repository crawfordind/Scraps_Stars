import { readFile } from "fs/promises";

const IMAGE_PATH =
  "C:\\Users\\Daniel\\.cursor\\projects\\c-Users-Daniel-Projects-Scraps-Stars\\assets\\c__Users_Daniel_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_fridge-70a96e5c-5abc-4a5b-831e-1a73f847efc0.png";
const BASE = process.env.TEST_BASE ?? "http://localhost:3001";

async function main() {
  const bytes = await readFile(IMAGE_PATH);
  const blob = new Blob([bytes], { type: "image/png" });
  const form = new FormData();
  form.append("file", blob, "fridge.png");

  console.log("1. Uploading to", BASE);
  const uploadRes = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  const uploadJson = await uploadRes.json();
  if (!uploadJson.ok) throw new Error(`Upload failed: ${uploadJson.error}`);
  console.log("   OK:", uploadJson.data.imageUrl);

  console.log("2. Extracting inventory...");
  const extractRes = await fetch(`${BASE}/api/inventory/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: uploadJson.data.imageUrl }),
  });
  const extractJson = await extractRes.json();
  if (!extractJson.ok) throw new Error(`Extract failed: ${extractJson.error}`);
  console.log("   OK:", extractJson.data.ingredients.length, "ingredients");

  console.log("3. Generating recipe...");
  const recipeRes = await fetch(`${BASE}/api/recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inventoryList: extractJson.data.ingredients.map((i: { ingredientName: string }) => i.ingredientName),
      preferences: [],
      tier: 1,
    }),
  });
  const recipeJson = await recipeRes.json();
  if (!recipeJson.ok) throw new Error(`Recipe failed: ${recipeJson.error}`);
  console.log("   OK:", recipeJson.data.recipe_name);
  console.log("\nFull flow succeeded.");
}

main().catch((err) => {
  console.error("FLOW FAILED:", err.message ?? err);
  process.exit(1);
});
