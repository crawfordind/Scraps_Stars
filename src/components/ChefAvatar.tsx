"use client";

import Image from "next/image";
import { useState } from "react";
import { chefAvatarAlt, getChefAvatarSrc } from "@/lib/chefs/avatars";
import type { ChefPersona } from "@/lib/chefs/personas";

type ChefAvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<ChefAvatarSize, number> = {
  sm: 36,
  md: 48,
  lg: 72,
  xl: 96,
};

type ChefAvatarProps = {
  chef: Pick<ChefPersona, "id" | "name" | "title" | "emoji">;
  size?: ChefAvatarSize;
  className?: string;
  priority?: boolean;
};

export function ChefAvatar({ chef, size = "md", className = "", priority = false }: ChefAvatarProps) {
  const [useFallback, setUseFallback] = useState(false);
  const px = SIZE_PX[size];

  if (useFallback) {
    return (
      <span
        className={`chef-avatar chef-avatar--fallback chef-avatar--${size} ${className}`.trim()}
        aria-hidden
      >
        {chef.emoji}
      </span>
    );
  }

  return (
    <Image
      src={getChefAvatarSrc(chef.id)}
      alt={chefAvatarAlt(chef)}
      width={px}
      height={px}
      sizes={`${px}px`}
      className={`chef-avatar chef-avatar--${size} ${className}`.trim()}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      onError={() => setUseFallback(true)}
    />
  );
}
