import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedRecipes } from "@/db/schema";
import type { RecipeOutput, Tier } from "@/lib/llm/types";
import type { SavedRecipeSummary } from "@/lib/recommendations/engine";
import { generateShareId } from "@/lib/share/shareId";

export type SavedRecipeRow = {
  id: string;
  shareId: string;
  userId: string;
  recipeName: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  inventorySnapshot: string[];
  liked: boolean;
  platedPhotoUrl: string | null;
  nailedIt: boolean | null;
  createdAt: Date;
};

function mapRow(row: typeof savedRecipes.$inferSelect): SavedRecipeRow {
  return {
    id: row.id,
    shareId: row.shareId,
    userId: row.userId,
    recipeName: row.recipeName,
    recipe: JSON.parse(row.recipeJson) as RecipeOutput,
    chefId: row.chefId,
    tier: row.tier as Tier,
    inventorySnapshot: row.inventorySnapshot ? (JSON.parse(row.inventorySnapshot) as string[]) : [],
    liked: row.liked,
    platedPhotoUrl: row.platedPhotoUrl,
    nailedIt: row.nailedIt,
    createdAt: row.createdAt,
  };
}

export async function saveRecipe(args: {
  userId: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  inventorySnapshot?: string[];
}) {
  const id = `${args.userId}-recipe-${Date.now()}`;
  const shareId = generateShareId();
  await db.insert(savedRecipes).values({
    id,
    shareId,
    userId: args.userId,
    recipeName: args.recipe.recipe_name,
    recipeJson: JSON.stringify(args.recipe),
    chefId: args.chefId,
    tier: args.tier,
    inventorySnapshot: args.inventorySnapshot ? JSON.stringify(args.inventorySnapshot) : null,
    liked: true,
    createdAt: new Date(),
  });
  return { id, shareId };
}

export async function getSavedRecipes(userId: string): Promise<SavedRecipeRow[]> {
  const rows = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, userId))
    .orderBy(desc(savedRecipes.createdAt));

  return rows.map(mapRow);
}

export async function getSavedRecipeById(id: string): Promise<SavedRecipeRow | null> {
  const row = await db.select().from(savedRecipes).where(eq(savedRecipes.id, id)).get();
  return row ? mapRow(row) : null;
}

export async function getSavedRecipeByShareId(shareId: string): Promise<SavedRecipeRow | null> {
  const row = await db.select().from(savedRecipes).where(eq(savedRecipes.shareId, shareId)).get();
  return row ? mapRow(row) : null;
}
export async function updateRecipeAfterVerdict(args: {
  recipeId: string;
  recipe?: RecipeOutput;
  platedPhotoUrl?: string | null;
  nailedIt?: boolean;
}) {
  const updates: Partial<typeof savedRecipes.$inferInsert> = {};
  if (args.recipe) updates.recipeJson = JSON.stringify(args.recipe);
  if (args.platedPhotoUrl !== undefined) updates.platedPhotoUrl = args.platedPhotoUrl;
  if (args.nailedIt !== undefined) updates.nailedIt = args.nailedIt;
  if (Object.keys(updates).length === 0) return;
  await db.update(savedRecipes).set(updates).where(eq(savedRecipes.id, args.recipeId));
}

export async function getSavedRecipeSummaries(userId: string): Promise<SavedRecipeSummary[]> {
  const rows = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.userId, userId))
    .orderBy(desc(savedRecipes.createdAt));

  return rows.map((row) => {
    const recipe = JSON.parse(row.recipeJson) as RecipeOutput;
    return {
      chefId: row.chefId,
      tier: row.tier as Tier,
      recipeName: row.recipeName,
      pantryIngredients: recipe.ingredients_pantry,
      flavorProfile: recipe.flavor_profile_explanation,
    };
  });
}

export async function deleteSavedRecipe(userId: string, recipeId: string) {
  await db.delete(savedRecipes).where(eq(savedRecipes.id, recipeId));
}

export async function ensureShareId(recipeId: string): Promise<string> {
  const row = await db.select().from(savedRecipes).where(eq(savedRecipes.id, recipeId)).get();
  if (!row) throw new Error("Recipe not found");
  if (row.shareId) return row.shareId;
  const shareId = generateShareId();
  await db.update(savedRecipes).set({ shareId }).where(eq(savedRecipes.id, recipeId));
  return shareId;
}
