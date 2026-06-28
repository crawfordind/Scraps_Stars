import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getSavedRecipeByShareId } from "@/lib/db/recipes";
import { getChefById } from "@/lib/chefs/personas";
import { getDisplayHandle } from "@/lib/identity/session";
import { buildShareCardData } from "@/lib/share/cardData";
import { RecipeReadOnly } from "@/components/RecipeReadOnly";

type PageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const recipe = await getSavedRecipeByShareId(shareId);
  if (!recipe) {
    return { title: "Recipe not found · Barefeast" };
  }

  // Prefer the canonical URL when configured; otherwise derive the absolute
  // origin from the request so social previews resolve correctly in any
  // environment (preview deploys, non-default dev ports, etc.) instead of a
  // hardcoded localhost:3000 that breaks the og:image.
  let origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    origin = host ? `${proto}://${host}` : "http://localhost:3000";
  }
  const cardUrl = `${origin}/api/share-card/${shareId}?format=link`;

  return {
    title: `${recipe.recipeName} · Barefeast`,
    description: recipe.recipe.flavor_profile_explanation,
    openGraph: {
      title: recipe.recipeName,
      description: recipe.recipe.flavor_profile_explanation,
      images: [{ url: cardUrl, width: 1200, height: 630, alt: recipe.recipeName }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.recipeName,
      description: recipe.recipe.flavor_profile_explanation,
      images: [cardUrl],
    },
  };
}

export default async function SharedRecipePage({ params }: PageProps) {
  const { shareId } = await params;
  const recipe = await getSavedRecipeByShareId(shareId);

  if (!recipe) {
    return (
      <main id="main-content" className="public-page">
        <p>This feast has left the table.</p>
        <Link href="/">Back to barefeast</Link>
      </main>
    );
  }

  const chef = getChefById(recipe.chefId);
  const handle = await getDisplayHandle(recipe.userId);
  const cardData = buildShareCardData({
    shareId,
    recipe: recipe.recipe,
    chefId: recipe.chefId,
    tier: recipe.tier,
    handle,
    platedPhotoUrl: recipe.platedPhotoUrl,
    nailedIt: recipe.nailedIt ?? false,
  });

  return (
    <main id="main-content" className="public-page">
      <header className="public-page__hero">
        <p className="public-page__eyebrow">barefeast · feast card</p>
        <h1>{recipe.recipeName}</h1>
        <p className="public-page__meta">
          {chef?.emoji} {chef?.name ?? "Host"} · Tier {recipe.tier} · by @{handle}
        </p>
        {recipe.platedPhotoUrl && (
          <div className="public-page__photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recipe.platedPhotoUrl} alt={`Plated ${recipe.recipeName}`} />
          </div>
        )}
        <div className="public-page__stats">
          <span>{cardData.impact.foodRescuedKg} kg rescued (est.)</span>
          <span>${cardData.impact.moneySavedUsd} saved (est.)</span>
          <span>{cardData.impact.co2SavedKg} kg CO₂ (est.)</span>
        </div>
      </header>

      <RecipeReadOnly recipe={recipe.recipe} chefName={chef?.name ?? "Host"} tier={recipe.tier} />

      <div className="public-page__cta-row">
        <Link href={`/cook/${recipe.id}`} className="primary-btn">
          Cook this
        </Link>
        <Link href="/challenge/shame-shelf-sunday" className="secondary-btn">
          Join Shame Shelf Sunday
        </Link>
      </div>
    </main>
  );
}
