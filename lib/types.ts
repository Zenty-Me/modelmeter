export type Currency = "USD";

export type Provider = "OpenAI" | "Anthropic" | "Google";

/**
 * ModelMeter compares standard, on-demand text pricing only.
 * Batch, Flex and Fast/Priority tiers are deliberately out of scope.
 */
export type PricingMode = "standard";

/**
 * A single published price point for a model.
 *
 * Tiers are plain data: the resolver in `lib/pricing-engine.ts` reads these
 * bounds, and no component ever has to know a model by name.
 */
export interface PricingTier {
  id: string;
  label: string;
  /** Badge shown on the model card when this tier is the one that applies. */
  badgeLabel?: string;

  inputPricePerMillion: number;
  outputPricePerMillion: number;

  /** Inclusive lower bound on input tokens in a single request. */
  minInputTokens?: number;
  /** Inclusive upper bound on input tokens in a single request. */
  maxInputTokens?: number;
}

export interface AIModelPricing {
  id: string;
  provider: Provider;
  /** Model name as published by the provider. */
  model: string;
  /** Exact identifier passed to the provider's API. */
  modelId: string;

  /**
   * Ordered pricing tiers. The first entry is the base tier and is also the
   * fallback when no bounds match.
   */
  pricingTiers: PricingTier[];

  currency: Currency;
  pricingMode: PricingMode;

  /**
   * Documents pricing rules that exist for this model but are outside the
   * comparison scope. Never left implicit: an unmodelled tier must be stated
   * here.
   */
  contextNotes?: string;

  sourceName: string;
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) of the manual verification against the source. */
  checkedAt: string;

  /** Anything excluded from the quoted numbers. */
  notes?: string;

  isDemoData: boolean;
}

export interface UsageInput {
  monthlyRequests: number;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
}

/**
 * Raw form values are kept as strings so that an empty input can be
 * represented before it is parsed into a number.
 */
export type UsageDraft = Record<keyof UsageInput, string>;

export interface MonthlyTokens {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  model: AIModelPricing;
  /** The tier selected for this usage by `resolvePricingTier`. */
  tier: PricingTier;
  /** The value that selected the tier, kept so cards can explain themselves. */
  inputTokensPerRequest: number;
  monthlyTokens: MonthlyTokens;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: Currency;
}

export interface CostComparisonEntry {
  estimate: CostEstimate;
  isLowestCost: boolean;
  /** Difference against the lowest-cost estimate. Zero for the cheapest one. */
  absoluteDifference: number;
  /**
   * How much more expensive this model is than the lowest-cost one:
   * `(current - lowest) / lowest * 100`. `null` when the lowest cost is zero,
   * because a percentage against a zero baseline is meaningless.
   *
   * This is NOT the same quantity as `CostComparison.savingsPercentage` — see
   * the note there before reusing either one.
   */
  higherThanLowestPercentage: number | null;
}

export interface CostComparison {
  /** Estimates sorted by total cost, ascending. */
  entries: CostComparisonEntry[];
  lowest: CostEstimate | null;
  highest: CostEstimate | null;
  /** `highest.totalCost - lowest.totalCost`. Zero when all models tie. */
  savingsAmount: number;
  /**
   * Share of the highest cost that is avoided by choosing the lowest instead:
   * `(highest - lowest) / highest * 100`. The denominator is the cost the user
   * is currently paying, which is what makes this a saving.
   *
   * Kept deliberately separate from `higherThanLowestPercentage`, which divides
   * by the *lowest* cost to answer a different question. Never mix the two.
   * Always a finite number in `[0, 100]`; `0` when the highest cost is zero.
   */
  savingsPercentage: number;
  /**
   * False when every model costs the same — for example with zero usage.
   * The ranking UI is hidden in that case rather than claiming a winner.
   */
  hasCostRange: boolean;
}

export interface PricingSource {
  provider: Provider;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  isVerified: boolean;
}

/**
 * A one-click example workload.
 *
 * It carries the three usage fields directly, so a preset can be handed to
 * `toUsageDraft` or the calculator without unwrapping anything.
 */
export interface UsagePreset extends UsageInput {
  id: string;
  label: string;
  /** Shown under the group while this preset is the selected one. */
  description: string;
}
