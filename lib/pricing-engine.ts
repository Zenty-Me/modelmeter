import type { AIModelPricing, PricingTier } from "./types";

/**
 * Pricing tier resolution.
 *
 * Every rule lives in `lib/pricing.ts` as data (`minInputTokens` /
 * `maxInputTokens`). This module only reads those bounds, so no component or
 * helper has to test for a specific model name.
 */

const NO_LOWER_BOUND = 0;
const NO_UPPER_BOUND = Number.POSITIVE_INFINITY;

/** Token counts are non-negative and finite; anything else resolves as zero. */
function toTokenCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return NO_LOWER_BOUND;
  return value;
}

/** The base tier is the first entry and the fallback for every model. */
export function getBaseTier(model: AIModelPricing): PricingTier {
  return model.pricingTiers[0];
}

export function hasMultipleTiers(model: AIModelPricing): boolean {
  return model.pricingTiers.length > 1;
}

function isApplicable(tier: PricingTier, inputTokens: number): boolean {
  const min = tier.minInputTokens ?? NO_LOWER_BOUND;
  const max = tier.maxInputTokens ?? NO_UPPER_BOUND;

  return inputTokens >= min && inputTokens <= max;
}

/**
 * Selects the published price point for a request of `inputTokensPerRequest`.
 *
 * Bounds are inclusive, so a provider threshold of 200,000 means 200,000 stays
 * on the base tier while 200,001 moves to the long-context tier.
 */
export function resolvePricingTier(
  model: AIModelPricing,
  inputTokensPerRequest: number,
): PricingTier {
  const inputTokens = toTokenCount(inputTokensPerRequest);

  const match = model.pricingTiers.find((tier) =>
    isApplicable(tier, inputTokens),
  );

  return match ?? getBaseTier(model);
}

/**
 * The published context boundary for a model, for display only.
 *
 * It is read from the base tier's upper bound, so it is a single round number
 * per model (`272000`, `200000`) rather than an off-by-one lower bound. Models
 * published as a single rate have no boundary and return `null`.
 */
export function getContextThreshold(model: AIModelPricing): number | null {
  return getBaseTier(model).maxInputTokens ?? null;
}
