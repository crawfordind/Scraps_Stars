import Link from "next/link";
import { getSavedRecipeById } from "@/lib/db/recipes";
import { getUserProfile } from "@/lib/db/user";
import { resolveUserIdFromRequest } from "@/lib/identity/session";
import { LiveCookExperience } from "@/components/LiveCookExperience";

type PageProps = {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ challenge?: string }>;
};

export default async function CookRecipePage({ params, searchParams }: PageProps) {
  const { recipeId } = await params;
  const { challenge } = await searchParams;
  const userId = await resolveUserIdFromRequest();
  const recipe = await getSavedRecipeById(recipeId);

  if (!recipe) {
    return (
      <main id="main-content" className="public-page">
        <p>Recipe not found.</p>
        <Link href="/cook">Back to barefeast</Link>
      </main>
    );
  }

  const user = await getUserProfile(userId);

  return (
    <main id="main-content" className="cook-page">
      <LiveCookExperience
        recipeRow={recipe}
        initialXp={user?.xp ?? 0}
        initialLevel={user?.level ?? 1}
        challengeId={challenge}
      />
    </main>
  );
}
