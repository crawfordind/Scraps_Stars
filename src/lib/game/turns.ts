export type GameTurn = 1 | 2 | 3 | 4 | 5;

export type GamePhase = "choose-chef" | "scout" | "consult" | "strategy" | "create" | "verdict";

export const TURN_PHASES: Array<{
  turn: GameTurn;
  phase: GamePhase;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    turn: 1,
    phase: "choose-chef",
    label: "Pick Your Chef",
    shortLabel: "Chef",
    description: "Choose a world-class mentor for this round",
  },
  {
    turn: 2,
    phase: "scout",
    label: "Scout the Fridge",
    shortLabel: "Scout",
    description: "Photograph your fridge, pantry, or spice rack",
  },
  {
    turn: 3,
    phase: "consult",
    label: "Chef Consult",
    shortLabel: "Consult",
    description: "Your chef reviews what you have",
  },
  {
    turn: 4,
    phase: "strategy",
    label: "Set Strategy",
    shortLabel: "Plan",
    description: "Choose how far to stretch your pantry",
  },
  {
    turn: 5,
    phase: "create",
    label: "Create & Save",
    shortLabel: "Cook",
    description: "Get your recipe, save favorites, earn XP",
  },
];

export function phaseToTurn(phase: GamePhase): GameTurn {
  const match = TURN_PHASES.find((t) => t.phase === phase);
  return match?.turn ?? 1;
}

export function getTurnInfo(turn: GameTurn) {
  return TURN_PHASES.find((t) => t.turn === turn) ?? TURN_PHASES[0];
}

export function xpForLevel(level: number): number {
  return level * 50;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let threshold = xpForLevel(level);
  while (xp >= threshold) {
    level++;
    threshold += xpForLevel(level);
  }
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; level: number } {
  const level = levelFromXp(xp);
  let xpAtLevelStart = 0;
  for (let l = 1; l < level; l++) {
    xpAtLevelStart += xpForLevel(l);
  }
  const needed = xpForLevel(level);
  return { current: xp - xpAtLevelStart, needed, level };
}
