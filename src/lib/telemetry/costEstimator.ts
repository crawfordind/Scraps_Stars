import { getModelPricing } from "./modelPricing";

export type CostEstimateInput = {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
};

export type CostEstimate = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  inputRatePerMillion: number;
  outputRatePerMillion: number;
};

export function estimateRequestCost(input: CostEstimateInput): CostEstimate {
  const promptTokens = input.promptTokens ?? 0;
  const completionTokens = input.completionTokens ?? 0;
  const { input: inputRate, output: outputRate } = getModelPricing(input.model);

  const inputCost = (promptTokens / 1_000_000) * inputRate;
  const outputCost = (completionTokens / 1_000_000) * outputRate;

  return {
    model: input.model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostUsd: inputCost + outputCost,
    inputRatePerMillion: inputRate,
    outputRatePerMillion: outputRate,
  };
}

export function formatCostUsd(cost: number): string {
  if (cost < 0.0001) return "<$0.0001";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
