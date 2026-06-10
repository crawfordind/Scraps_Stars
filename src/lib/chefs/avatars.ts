import type { ChefPersona } from "@/lib/chefs/personas";

export function getChefAvatarSrc(chefId: string): string {
  return `/chefs/${chefId}.webp`;
}

export function chefAvatarAlt(chef: Pick<ChefPersona, "name" | "title">): string {
  return `${chef.name}, ${chef.title}`;
}
