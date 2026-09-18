import type {
  AIModelPricing,
  CostEstimate,
  MonthlyTokens,
  UsageDraft,
  UsageInput,
} from "./types";

const TOKENS_PER_MILLION = 1_000_000;

/**
 * Upper bound for every value that flows through the calculator.
 * Prevents Infinity from reaching the UI when users type extreme numbers.
 */
const MAX_VALUE = 1e12;

/** Replaces NaN with 0, negatives with 0 and Infinity with MAX_VALUE. */
function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  return Math.min(value, MAX_VALUE);
}

export function parseUsageValue(raw: string): number {
  return clamp(Number(raw.trim()));
}

export function parseUsageDraft(draft: UsageDraft): UsageInput {
  return {
    monthlyRequests: parseUsageValue(draft.monthlyRequests),
    inputTokensPerRequest: parseUsageValue(draft.inputTokensPerRequest),
    outputTokensPerRequest: parseUsageValue(draft.outputTokensPerRequest),
  };
}

export function toUsageDraft(usage: UsageInput): UsageDraft {
  return {
    monthlyRequests: String(usage.monthlyRequests),
    inputTokensPerRequest: String(usage.inputTokensPerRequest),
    outputTokensPerRequest: String(usage.outputTokensPerRequest),
  };
}

/** Guards against invalid values coming from anywhere other than the form. */
export function normalizeUsage(usage: UsageInput): UsageInput {
  return {
    monthlyRequests: clamp(usage.monthlyRequests),
    inputTokensPerRequest: clamp(usage.inputTokensPerRequest),
    outputTokensPerRequest: clamp(usage.outputTokensPerRequest),
  };
}

export function calculateMonthlyTokens(usage: UsageInput): MonthlyTokens {
  const safe = normalizeUsage(usage);
  const inputTokens = clamp(safe.monthlyRequests * safe.inputTokensPerRequest);
  const outputTokens = clamp(safe.monthlyRequests * safe.outputTokensPerRequest);

  return {
    inputTokens,
    outputTokens,
    totalTokens: clamp(inputTokens + outputTokens),
  };
}

export function calculateInputCost(
  inputTokens: number,
  model: AIModelPricing,
): number {
  const price = clamp(model.inputPricePerMillion);
  return clamp((clamp(inputTokens) / TOKENS_PER_MILLION) * price);
}

export function calculateOutputCost(
  outputTokens: number,
  model: AIModelPricing,
): number {
  const price = clamp(model.outputPricePerMillion);
  return clamp((clamp(outputTokens) / TOKENS_PER_MILLION) * price);
}

export function calculateTotalCost(
  inputCost: number,
  outputCost: number,
): number {
  return clamp(clamp(inputCost) + clamp(outputCost));
}

export function calculateModelEstimate(
  model: AIModelPricing,
  usage: UsageInput,
): CostEstimate {
  const monthlyTokens = calculateMonthlyTokens(usage);
  const inputCost = calculateInputCost(monthlyTokens.inputTokens, model);
  const outputCost = calculateOutputCost(monthlyTokens.outputTokens, model);

  return {
    model,
    monthlyTokens,
    inputCost,
    outputCost,
    totalCost: calculateTotalCost(inputCost, outputCost),
    currency: model.currency,
  };
}

export function calculateAllModelEstimates(
  models: AIModelPricing[],
  usage: UsageInput,
): CostEstimate[] {
  return models.map((model) => calculateModelEstimate(model, usage));
}

export function sortEstimatesByCost(
  estimates: CostEstimate[],
): CostEstimate[] {
  return [...estimates].sort((a, b) => a.totalCost - b.totalCost);
}
