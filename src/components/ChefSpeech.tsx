"use client";

import type { ChefPersona } from "@/lib/chefs/personas";
import { ChefAvatar } from "./ChefAvatar";

type ChefSpeechProps = {
  chef: Pick<ChefPersona, "id" | "name" | "title" | "emoji">;
  message: string;
  label?: string;
};

export function ChefSpeech({ chef, message, label = "Chef says" }: ChefSpeechProps) {
  return (
    <div className="chef-speech" role="note">
      <ChefAvatar chef={chef} size="md" className="chef-speech__avatar-img" />
      <div className="chef-speech__bubble">
        <p className="chef-speech__label">
          {label} — <strong>{chef.name}</strong>
        </p>
        <p className="chef-speech__text">{message}</p>
      </div>
    </div>
  );
}
