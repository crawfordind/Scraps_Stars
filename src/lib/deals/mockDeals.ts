import type { PantryProfile } from "@/lib/coach/types";

export type DealMatchReason = "staple" | "pantry_pair" | "recipe";

export type DealItem = {
  ingredient: string;
  originalPrice: number;
  salePrice: number;
  unit: string;
  matchReason: DealMatchReason;
  matchLabel: string;
};

export type StoreDeal = {
  id: string;
  name: string;
  distanceMiles: number;
  logoInitial: string;
  accentHue: number;
  items: DealItem[];
};

export type NearbyDeals = {
  stores: StoreDeal[];
  personalizedFrom: string[];
};

type CatalogEntry = {
  ingredient: string;
  originalPrice: number;
  salePrice: number;
  unit: string;
  stapleKeywords: string[];
  pairKeywords: string[];
  recipeHint?: string;
};

const MATCH_LABELS: Record<DealMatchReason, string> = {
  staple: "You cook with this",
  pantry_pair: "Pairs with your pantry",
  recipe: "For your next recipe",
};

const CATALOG: CatalogEntry[] = [
  {
    ingredient: "Organic eggs",
    originalPrice: 5.49,
    salePrice: 3.99,
    unit: "dozen",
    stapleKeywords: ["egg", "eggs"],
    pairKeywords: ["butter", "cheese", "flour"],
  },
  {
    ingredient: "Baby spinach",
    originalPrice: 3.99,
    salePrice: 2.49,
    unit: "5 oz",
    stapleKeywords: ["spinach", "greens", "lettuce"],
    pairKeywords: ["garlic", "lemon", "olive oil"],
  },
  {
    ingredient: "Whole milk",
    originalPrice: 4.29,
    salePrice: 3.19,
    unit: "gallon",
    stapleKeywords: ["milk", "dairy"],
    pairKeywords: ["butter", "flour", "eggs"],
  },
  {
    ingredient: "Yellow onions",
    originalPrice: 2.49,
    salePrice: 1.49,
    unit: "3 lb bag",
    stapleKeywords: ["onion", "onions"],
    pairKeywords: ["garlic", "potato", "tomato"],
  },
  {
    ingredient: "Roma tomatoes",
    originalPrice: 3.29,
    salePrice: 1.99,
    unit: "lb",
    stapleKeywords: ["tomato", "tomatoes"],
    pairKeywords: ["basil", "garlic", "onion"],
    recipeHint: "tomato basil pasta",
  },
  {
    ingredient: "Jasmine rice",
    originalPrice: 6.99,
    salePrice: 4.99,
    unit: "2 lb",
    stapleKeywords: ["rice"],
    pairKeywords: ["soy sauce", "ginger", "garlic"],
  },
  {
    ingredient: "Sharp cheddar",
    originalPrice: 5.79,
    salePrice: 4.29,
    unit: "8 oz",
    stapleKeywords: ["cheese", "cheddar"],
    pairKeywords: ["bread", "eggs", "potato"],
  },
  {
    ingredient: "Fresh basil",
    originalPrice: 2.99,
    salePrice: 1.79,
    unit: "bunch",
    stapleKeywords: ["basil", "herbs"],
    pairKeywords: ["tomato", "garlic", "mozzarella"],
    recipeHint: "caprese salad",
  },
  {
    ingredient: "Greek yogurt",
    originalPrice: 5.49,
    salePrice: 3.99,
    unit: "32 oz",
    stapleKeywords: ["yogurt"],
    pairKeywords: ["honey", "berries", "granola"],
  },
  {
    ingredient: "Boneless chicken thighs",
    originalPrice: 7.99,
    salePrice: 5.49,
    unit: "lb",
    stapleKeywords: ["chicken"],
    pairKeywords: ["garlic", "lemon", "rice"],
    recipeHint: "lemon herb chicken",
  },
  {
    ingredient: "Sourdough loaf",
    originalPrice: 4.99,
    salePrice: 3.49,
    unit: "each",
    stapleKeywords: ["bread", "sourdough"],
    pairKeywords: ["butter", "cheese", "avocado"],
  },
  {
    ingredient: "Avocados",
    originalPrice: 2.49,
    salePrice: 1.29,
    unit: "each",
    stapleKeywords: ["avocado"],
    pairKeywords: ["lime", "onion", "tomato"],
  },
  {
    ingredient: "Garlic",
    originalPrice: 1.99,
    salePrice: 0.99,
    unit: "3 bulbs",
    stapleKeywords: ["garlic"],
    pairKeywords: ["onion", "ginger", "butter"],
  },
  {
    ingredient: "Frozen peas",
    originalPrice: 2.79,
    salePrice: 1.89,
    unit: "16 oz",
    stapleKeywords: ["peas"],
    pairKeywords: ["rice", "pasta", "butter"],
  },
  {
    ingredient: "Olive oil",
    originalPrice: 9.99,
    salePrice: 7.49,
    unit: "500 ml",
    stapleKeywords: ["olive oil", "oil"],
    pairKeywords: ["garlic", "lemon", "pasta"],
  },
];

const MOCK_STORES = [
  { id: "mercer", name: "Mercer's Market", distanceMiles: 0.8, logoInitial: "M", accentHue: 145 },
  { id: "greenwood", name: "Greenwood Provisions", distanceMiles: 1.2, logoInitial: "G", accentHue: 38 },
  { id: "hearth", name: "Hearth & Field Co-op", distanceMiles: 1.5, logoInitial: "H", accentHue: 165 },
  { id: "oak", name: "Oak Street Pantry", distanceMiles: 2.1, logoInitial: "O", accentHue: 32 },
] as const;

function normalizeIngredient(value: string): string {
  return value.toLowerCase().trim();
}

function matchesKeyword(ingredient: string, keywords: string[]): boolean {
  const normalized = normalizeIngredient(ingredient);
  return keywords.some(
    (kw) => normalized.includes(kw) || kw.includes(normalized),
  );
}

function classifyMatch(
  entry: CatalogEntry,
  staples: string[],
  pantry: string[],
): { reason: DealMatchReason; label: string } {
  if (staples.some((s) => matchesKeyword(s, entry.stapleKeywords))) {
    return { reason: "staple", label: MATCH_LABELS.staple };
  }
  if (pantry.some((p) => matchesKeyword(p, entry.pairKeywords))) {
    return { reason: "pantry_pair", label: MATCH_LABELS.pantry_pair };
  }
  if (entry.recipeHint) {
    return { reason: "recipe", label: MATCH_LABELS.recipe };
  }
  return { reason: "pantry_pair", label: MATCH_LABELS.pantry_pair };
}

function scoreEntry(
  entry: CatalogEntry,
  staples: string[],
  pantry: string[],
): number {
  if (staples.some((s) => matchesKeyword(s, entry.stapleKeywords))) return 3;
  if (pantry.some((p) => matchesKeyword(p, entry.pairKeywords))) return 2;
  if (entry.recipeHint) return 1;
  return 0;
}

function pickItemsForStore(
  storeIndex: number,
  staples: string[],
  pantry: string[],
  count: number,
): DealItem[] {
  const ranked = [...CATALOG]
    .map((entry, catalogIndex) => ({
      entry,
      score: scoreEntry(entry, staples, pantry),
      catalogIndex,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.catalogIndex + storeIndex * 3) % CATALOG.length -
        (b.catalogIndex + storeIndex * 3) % CATALOG.length;
    });

  const seen = new Set<string>();
  const items: DealItem[] = [];

  for (const { entry } of ranked) {
    if (items.length >= count) break;
    const key = entry.ingredient.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const { reason, label } = classifyMatch(entry, staples, pantry);
    items.push({
      ingredient: entry.ingredient,
      originalPrice: entry.originalPrice,
      salePrice: entry.salePrice,
      unit: entry.unit,
      matchReason: reason,
      matchLabel: label,
    });
  }

  return items;
}

export function formatSavingsPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function generateNearbyDeals(profile: PantryProfile): NearbyDeals {
  const staples = profile.staples.map(normalizeIngredient);
  const pantry = [
    ...staples,
    ...profile.recentScanIngredients.map(normalizeIngredient),
  ];

  const itemCounts = [3, 4, 2, 3];

  const stores: StoreDeal[] = MOCK_STORES.map((store, index) => ({
    ...store,
    items: pickItemsForStore(index, staples, pantry, itemCounts[index] ?? 3),
  }));

  const personalizedFrom = [
    ...new Set([...profile.staples, ...profile.recentScanIngredients.slice(0, 4)]),
  ].slice(0, 5);

  return { stores, personalizedFrom };
}
