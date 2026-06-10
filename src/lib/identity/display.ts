export function formatCompetitorLabel(name: string, handle?: string | null): string {
  const trimmed = name.trim();
  if (handle) return `${trimmed} (@${handle})`;
  return trimmed || "Chef";
}
