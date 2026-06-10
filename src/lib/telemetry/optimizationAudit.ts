import { estimateRequestCost, formatCostUsd } from "./costEstimator";

export type AuditEvent = {
  task: "inventory_extract" | "recipe_generate" | "recipe_revise" | "coach_briefing" | "gamification_copy";
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  fallbackUsed: boolean;
  ok: boolean;
  error?: string;
};

export function logOptimizationAudit(event: AuditEvent): void {
  const cost =
    event.estimatedCostUsd ??
    estimateRequestCost({
      model: event.model.split(" -> ")[0] ?? event.model,
      promptTokens: event.promptTokens,
      completionTokens: event.completionTokens,
    }).estimatedCostUsd;

  const payload = {
    ts: new Date().toISOString(),
    ...event,
    estimatedCostUsd: cost,
    estimatedCostFormatted: formatCostUsd(cost),
  };

  console.info("[optimization_audit]", JSON.stringify(payload));
}
