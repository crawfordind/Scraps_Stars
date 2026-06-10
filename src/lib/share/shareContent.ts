import type { DealItem, StoreDeal } from "@/lib/deals/mockDeals";
import { formatPrice, formatSavingsPercent } from "@/lib/deals/mockDeals";
import type { DashboardInsight, ImpactStats } from "@/lib/impact/calculator";
import type { RecipeOutput, Tier } from "@/lib/llm/types";

export type ShareContent = {
  title: string;
  text: string;
  url?: string;
};

const BRAND = "Barefeast";

const TIER_LABELS: Record<Tier, string> = {
  1: "strictly here",
  2: "bridge the gap",
  3: "full feast",
};

function brandFooter(tagline = "Bare fridge. Full table."): string {
  return `\n\n— ${BRAND} · ${tagline}`;
}

export function getShareUrl(path = ""): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

export function buildRecipeShare(
  recipe: RecipeOutput,
  chefName: string,
  tier: Tier,
): ShareContent {
  const lines: string[] = [
    "════ FEAST CARD ════",
    "",
    recipe.flavor_profile_explanation,
    "",
    `Host · ${chefName}`,
    `Tier · ${TIER_LABELS[tier]}`,
    `${recipe.estimated_time_minutes} min · ${recipe.difficulty} · +${recipe.xp_reward} XP`,
    "",
  ];

  if (recipe.ingredients_pantry.length > 0) {
    lines.push("From pantry:");
    for (const item of recipe.ingredients_pantry) {
      lines.push(`  • ${item}`);
    }
    lines.push("");
  }

  if (recipe.ingredients_shopping_list.length > 0) {
    lines.push("Shopping list:");
    for (const item of recipe.ingredients_shopping_list) {
      lines.push(`  • ${item}`);
    }
    lines.push("");
  }

  lines.push("Method:");
  recipe.steps.forEach((step, index) => {
    lines.push(`  ${index + 1}. ${step}`);
  });

  if (recipe.chef_waste_tip) {
    lines.push("", `Zero-waste note: ${recipe.chef_waste_tip}`);
  }

  lines.push(brandFooter());

  return {
    title: recipe.recipe_name,
    text: lines.join("\n"),
    url: getShareUrl(),
  };
}

export type RecordGlobalContext = {
  householdWastePercent: number;
  weeklyShopPercent: number;
  globalAnnualWasteTons?: number;
};

export function buildRecordShare(
  stats: ImpactStats,
  global: RecordGlobalContext,
): ShareContent {
  const billionTonnes =
    global.globalAnnualWasteTons != null
      ? (global.globalAnnualWasteTons / 1_000_000_000).toFixed(1)
      : "1.3";

  const lines = [
    "════ YOUR TABLE ════",
    "",
    `What you've brought to the table · Level ${stats.level}`,
    "",
    `Food rescued · ${stats.foodRescuedKg} kg`,
    `Meals saved · ${stats.mealsSaved}`,
    `Est. savings · $${stats.moneySavedUsd}`,
    `Ingredients rescued · ${stats.ingredientsRescued}`,
    `CO₂ avoided · ${stats.co2SavedKg} kg`,
    `Water saved · ${stats.waterSavedLiters.toLocaleString()} L`,
    `XP earned · ${stats.xpEarned}`,
    "",
    `That's roughly ${global.weeklyShopPercent}% of a typical weekly shop kept from waste.`,
    `Globally, ~${global.householdWastePercent}% of food never gets eaten — about ${billionTonnes} billion tonnes wasted every year.`,
  ];

  if (stats.favoriteChefName) {
    lines.push("", `Favorite coach · ${stats.favoriteChefName}`);
  }

  lines.push(brandFooter());

  return {
    title: "My table — Barefeast wins",
    text: lines.join("\n"),
    url: getShareUrl(),
  };
}

export function buildDealShare(store: StoreDeal, item: DealItem): ShareContent {
  const savings = formatSavingsPercent(item.originalPrice, item.salePrice);

  const lines = [
    "════ MARKET LEDGER ════",
    "",
    `${store.name} · ${store.distanceMiles} mi away`,
    "",
    `${item.ingredient} (${item.unit})`,
    `Was ${formatPrice(item.originalPrice)} → Now ${formatPrice(item.salePrice)} · Save ${savings}%`,
    item.matchLabel,
    "",
    "Neighborhood provision picked for your larder.",
    brandFooter("A feast from almost nothing."),
  ];

  return {
    title: `${item.ingredient} at ${store.name}`,
    text: lines.join("\n"),
    url: getShareUrl(),
  };
}

export function buildTipShare(tip: string, score?: number): ShareContent {
  const lines = [
    "════ LARDER NOTE ════",
    "",
    "From your resourceful host",
    "",
    tip,
  ];

  if (score != null) {
    lines.push("", `Larder readiness · ${score}/100`);
  }

  lines.push(brandFooter("You have more than you think."));

  return {
    title: "Larder tip from Barefeast",
    text: lines.join("\n"),
    url: getShareUrl(),
  };
}

export function buildInsightShare(insight: DashboardInsight): ShareContent {
  const lines = [
    "════ PERSONAL INSIGHT ════",
    "",
    insight.headline,
    "",
    insight.detail,
    "",
    `Next · ${insight.action}`,
    brandFooter(),
  ];

  return {
    title: insight.headline,
    text: lines.join("\n"),
    url: getShareUrl(),
  };
}
