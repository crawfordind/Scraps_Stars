"use client";

import { useEffect, useRef, useState } from "react";
import type { RecipeOutput, Tier } from "@/lib/llm/types";
import { getChefById } from "@/lib/chefs/personas";
import { buildRecipeShare } from "@/lib/share/shareContent";
import { cookRecipePath } from "@/lib/challenge/activeChallenge";
import { ChefAvatar } from "./ChefAvatar";
import { PrescriptionShareButton } from "./PrescriptionShareButton";
import { MotionLink } from "@/components/motion/ui";

export type SavedRecipeItem = {
  id: string;
  shareId?: string;
  recipeName: string;
  recipe: RecipeOutput;
  chefId: string;
  tier: Tier;
  inventorySnapshot: string[];
  createdAt: Date | string;
};

type SavedRecipesPanelProps = {
  recipes: SavedRecipeItem[];
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
};

function formatSavedDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SavedRecipesPanel({ recipes, open, onClose, onDelete }: SavedRecipesPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) setExpandedId(null);
  }, [open]);

  // Accessibility: trap focus entry on the dialog, close on Escape, and lock
  // background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="saved-drawer" role="dialog" aria-modal="true" aria-label="Saved recipes">
      <button
        type="button"
        className="saved-drawer__backdrop"
        aria-label="Close saved recipes"
        tabIndex={-1}
        onClick={onClose}
      />
      <div className="saved-drawer__panel">
        <header className="saved-drawer__header">
          <div>
            <h2>Banked feasts</h2>
            <p className="saved-drawer__subtitle">Tap a feast to expand — everything loads from your save.</p>
          </div>
          <button type="button" className="panel__link" onClick={onClose} ref={closeRef}>
            Close
          </button>
        </header>

        {recipes.length === 0 ? (
          <p className="saved-drawer__empty">
            Looks bare? Perfect. Save a feast you love and we&apos;ll learn your taste.
          </p>
        ) : (
          <ul className="saved-list">
            {recipes.map((item) => {
              const chef = getChefById(item.chefId);
              const isExpanded = expandedId === item.id;
              const { recipe } = item;

              return (
                <li key={item.id} className={`saved-list__item ${isExpanded ? "saved-list__item--open" : ""}`}>
                  <div className="saved-list__row">
                    <button
                      type="button"
                      className="saved-list__toggle"
                      aria-expanded={isExpanded}
                      onClick={() => toggle(item.id)}
                    >
                      <span className="saved-list__chevron" aria-hidden>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                      {chef && <ChefAvatar chef={chef} size="sm" className="saved-list__avatar" />}
                      <span className="saved-list__summary">
                        <strong>{item.recipeName}</strong>
                        <span className="saved-list__meta">
                          {chef?.name ?? "Chef"} · Tier {item.tier} · +{recipe.xp_reward} XP ·{" "}
                          {formatSavedDate(item.createdAt)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="saved-list__remove"
                      onClick={() => onDelete(item.id)}
                      aria-label={`Remove ${item.recipeName}`}
                    >
                      ×
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="saved-list__detail">
                      <p className="saved-list__flavor">{recipe.flavor_profile_explanation}</p>

                      <div className="saved-list__meta-row">
                        <span>{recipe.estimated_time_minutes} min</span>
                        <span>{recipe.difficulty}</span>
                      </div>

                      {item.inventorySnapshot.length > 0 && (
                        <div className="saved-list__section">
                          <h4>Fridge scan</h4>
                          <ul className="saved-list__chips">
                            {item.inventorySnapshot.map((ing, index) => (
                              <li key={`scan-${index}-${ing}`}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="saved-list__columns">
                        <div className="saved-list__section">
                          <h4>Pantry used</h4>
                          <ul>
                            {recipe.ingredients_pantry.map((ing, index) => (
                              <li key={`pantry-${index}-${ing}`}>{ing}</li>
                            ))}
                          </ul>
                        </div>

                        {recipe.ingredients_shopping_list.length > 0 && (
                          <div className="saved-list__section">
                            <h4>Shopping list</h4>
                            <ul>
                              {recipe.ingredients_shopping_list.map((ing, index) => (
                                <li key={`shop-${index}-${ing}`}>{ing}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="saved-list__section">
                        <h4>Steps</h4>
                        <ol>
                          {recipe.steps.map((step, index) => (
                            <li key={`step-${index}`}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {recipe.chef_waste_tip && (
                        <p className="saved-list__tip">
                          <strong>Zero-waste tip:</strong> {recipe.chef_waste_tip}
                        </p>
                      )}

                      <div className="saved-list__actions">
                        <MotionLink href={cookRecipePath(item.id)} className="primary-btn saved-list__cook">
                          Cook this
                        </MotionLink>
                        {item.shareId && (
                          <PrescriptionShareButton
                            shareId={item.shareId}
                            content={buildRecipeShare(recipe, chef?.name ?? "Chef", item.tier)}
                            compact
                            className="saved-list__share"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
