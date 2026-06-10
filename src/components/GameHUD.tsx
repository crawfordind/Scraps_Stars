"use client";

import type { ChefPersona } from "@/lib/chefs/personas";
import { TURN_PHASES, xpProgressInLevel, type GameTurn } from "@/lib/game/turns";
import { ChefAvatar } from "./ChefAvatar";

type GameHUDProps = {
  currentTurn: GameTurn;
  xp: number;
  level: number;
  chef: Pick<ChefPersona, "id" | "name" | "title" | "emoji">;
};

export function GameHUD({ currentTurn, xp, level, chef }: GameHUDProps) {
  const progress = xpProgressInLevel(xp);

  return (
    <header className="game-hud">
      <div className="game-hud__coach">
        <ChefAvatar chef={chef} size="md" className="game-hud__coach-photo" priority />
        <div>
          <p className="game-hud__coach-label">Your chef</p>
          <p className="game-hud__coach-name">{chef.name}</p>
        </div>
      </div>

      <div className="game-hud__xp">
        <div className="game-hud__xp-header">
          <span>Level {level}</span>
          <span>
            {progress.current}/{progress.needed} XP
          </span>
        </div>
        <div className="game-hud__xp-bar" role="progressbar" aria-valuenow={progress.current} aria-valuemin={0} aria-valuemax={progress.needed}>
          <div className="game-hud__xp-fill" style={{ width: `${Math.min(100, (progress.current / progress.needed) * 100)}%` }} />
        </div>
      </div>

      <nav className="turn-tracker" aria-label="Game turns">
        {TURN_PHASES.map((turn) => {
          const isActive = turn.turn === currentTurn;
          const isDone = turn.turn < currentTurn;

          return (
            <div
              key={turn.turn}
              className={`turn-tracker__step ${isActive ? "turn-tracker__step--active" : ""} ${isDone ? "turn-tracker__step--done" : ""}`}
            >
              <span className="turn-tracker__num">{turn.turn}</span>
              <span className="turn-tracker__label">{turn.shortLabel}</span>
            </div>
          );
        })}
      </nav>
    </header>
  );
}
