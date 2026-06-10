/**
 * Demo fixtures for the three UI pillars.
 * Replace with API-driven data in production.
 */

import type { HubUserSnapshot, UtilityState } from "./cookingTypes";

export const DEMO_HUB_SNAPSHOT: HubUserSnapshot = {
  displayName: "Daniel",
  gamification: {
    xp: 340,
    level: 4,
    streak: 5,
    levelProgress: 0.62,
    rankTitle: "Host of the Bare Table",
    badges: [
      { id: "b1", label: "First Rescue", icon: "🥬", earnedAt: "2026-06-01" },
      { id: "b2", label: "Timer Master", icon: "⏱", earnedAt: "2026-06-04" },
    ],
    pendingReward: null,
  },
  cards: [
    {
      id: "c1",
      variant: "recipe",
      title: "Caramelized onion frittata",
      body: "Uses your eggs, half an onion, and yesterday's herbs. 25 min.",
      ctaLabel: "Cook this",
      xpReward: 50,
      icon: "🍳",
    },
    {
      id: "c2",
      variant: "challenge",
      title: "Zero-waste stir-fry",
      body: "Clear three expiring veggies before Friday. Bonus XP if you nail it.",
      ctaLabel: "Accept challenge",
      xpReward: 75,
      icon: "🏆",
    },
    {
      id: "c3",
      variant: "tip",
      title: "Staple alert",
      body: "You're low on olive oil — neighborhood deal 20% off at Green Grocer.",
      ctaLabel: "View deal",
      icon: "💡",
    },
  ],
};

export const DEMO_UTILITY_STATE: UtilityState = {
  recipeId: "demo-frittata",
  recipeTitle: "Caramelized Onion Frittata",
  currentStepIndex: 0,
  timers: [],
  ingredients: [
    { id: "i1", name: "Eggs", amount: "6", checked: false },
    { id: "i2", name: "Onion", amount: "1 medium", checked: false },
    { id: "i3", name: "Olive oil", amount: "2 tbsp", checked: false },
  ],
  steps: [
    {
      id: "s1",
      order: 1,
      headline: "Slice the onion thin",
      detail: "Uniform slices caramelize evenly. Keep the root end intact for stability.",
      timerSeconds: 0,
    },
    {
      id: "s2",
      order: 2,
      headline: "Caramelize on medium-low",
      detail: "Stir every few minutes until deep golden — don't rush the heat.",
      timerSeconds: 900,
      timerLabel: "Caramelize 15 min",
    },
    {
      id: "s3",
      order: 3,
      headline: "Beat eggs with salt & pepper",
      detail: "Whisk until no streaks remain. Fold in herbs if using.",
    },
    {
      id: "s4",
      order: 4,
      headline: "Pour eggs over onions",
      detail: "Tilt the pan to distribute. Let the edges set before the center.",
      timerSeconds: 480,
      timerLabel: "Set 8 min",
    },
    {
      id: "s5",
      order: 5,
      headline: "Finish under the broiler",
      detail: "Top should puff and bronze. Watch closely — 2 minutes max.",
      timerSeconds: 120,
      timerLabel: "Broil 2 min",
    },
  ],
};
