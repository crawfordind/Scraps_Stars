"use client";

import { memo } from "react";
import type { ChefPersona } from "@/lib/chefs/personas";
import { ChefAvatar } from "./ChefAvatar";

type ChefPickerProps = {
  chefs: ChefPersona[];
  selectedId: string;
  suggestedId?: string;
  onSelect: (chefId: string) => void;
  disabled?: boolean;
};

export const ChefPicker = memo(function ChefPicker({ chefs, selectedId, suggestedId, onSelect, disabled }: ChefPickerProps) {
  return (
    <div className="chef-grid" role="listbox" aria-label="Choose your chef mentor">
      {chefs.map((chef) => {
        const isSelected = chef.id === selectedId;
        const isSuggested = chef.id === suggestedId && !isSelected;

        return (
          <button
            key={chef.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`chef-card ${isSelected ? "chef-card--selected" : ""} ${isSuggested ? "chef-card--suggested" : ""}`}
            onClick={() => onSelect(chef.id)}
            disabled={disabled}
          >
            <ChefAvatar chef={chef} size="lg" className="chef-card__photo" />
            <span className="chef-card__name">{chef.name}</span>
            <span className="chef-card__title">{chef.title}</span>
            <span className="chef-card__origin">{chef.origin}</span>
            {isSuggested && <span className="chef-card__badge">Recommended</span>}
          </button>
        );
      })}
    </div>
  );
});
