import type {
  AIModelPricing,
  CostComparison,
  CostEstimate,
  MonthlyTokens,
  PricingTier,
  UsageDraft,
  UsageInput,
} from "./types";
import { resolvePricingTier } from "./pricing-engine";

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
  tier: PricingTier,
): number {
  const price = clamp(tier.inputPricePerMillion);
  return clamp((clamp(inputTokens) / TOKENS_PER_MILLION) * price);
}

export function calculateOutputCost(
  outputTokens: number,
  tier: PricingTier,
): number {
  const price = clamp(tier.outputPricePerMillion);
  return clamp((clamp(outputTokens) / TOKENS_PER_MILLION) * price);
}

export function calculateTotalCost(
  inputCost: number,
  outputCost: number,
): number {
  return clamp(clamp(inputCost) + clamp(outputCost));
}

/**
 * Costs a model against a usage estimate.
 *
 * The pricing tier is resolved from the average input tokens per request, so a
 * provider's long-context rate is applied automatically without the caller
 * knowing anything about the model.
 */
export function calculateModelEstimate(
  model: AIModelPricing,
  usage: UsageInput,
): CostEstimate {
  const safe = normalizeUsage(usage);
  const monthlyTokens = calculateMonthlyTokens(safe);
  const tier = resolvePricingTier(model, safe.inputTokensPerRequest);

  const inputCost = calculateInputCost(monthlyTokens.inputTokens, tier);
  const outputCost = calculateOutputCost(monthlyTokens.outputTokens, tier);

  return {
    model,
    tier,
    inputTokensPerRequest: safe.inputTokensPerRequest,
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

/** Relative to a zero baseline a percentage would be meaningless, so it is null. */
function percentageOf(part: number, baseline: number): number | null {
  return baseline > 0 ? (part / baseline) * 100 : null;
}

/**
 * Saving achieved by moving from the highest cost to the lowest.
 *
 * The highest cost is the denominator: it is the amount the user is spending
 * today, so the result reads as "this share of your current spend disappears".
 * Dividing by the lowest cost instead would answer a different question
 * ("how much more expensive is the pricier option") and can exceed 100%.
 */
function savingsPercentageOf(highestCost: number, lowestCost: number): number {
  if (!(highestCost > 0)) return 0;

  const percentage = ((highestCost - lowestCost) / highestCost) * 100;
  if (!Number.isFinite(percentage)) return 0;

  // lowestCost <= highestCost by construction, so the ratio is already within
  // [0, 100]; clamping guarantees the UI can never render a nonsense figure.
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Ranks estimates by estimated monthly cost and derives the figures shown in
 * the comparison summary. Cost only — no signal about model quality is implied.
 */
export function calculateCostComparison(
  estimates: CostEstimate[],
): CostComparison {
  const sorted = sortEstimatesByCost(estimates);
  const lowest = sorted.length > 0 ? sorted[0] : null;
  const highest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const lowestCost = lowest?.totalCost ?? 0;
  const highestCost = highest?.totalCost ?? 0;

  const entries = sorted.map((estimate) => {
    const absoluteDifference = clamp(estimate.totalCost - lowestCost);

    return {
      estimate,
      isLowestCost: lowest !== null && estimate.model.id === lowest.model.id,
      absoluteDifference,
      higherThanLowestPercentage: percentageOf(absoluteDifference, lowestCost),
    };
  });

  const savingsAmount = clamp(highestCost - lowestCost);

  return {
    entries,
    lowest,
    highest,
    savingsAmount,
    savingsPercentage: savingsPercentageOf(highestCost, lowestCost),
    hasCostRange: savingsAmount > 0,
  };
}
