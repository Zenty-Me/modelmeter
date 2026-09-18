export type Currency = "USD";

export type Provider = "OpenAI" | "Anthropic" | "Google";

/**
 * V0.2 only compares standard, on-demand text pricing.
 * Batch, Flex and Fast/Priority tiers are deliberately out of scope.
 */
export type PricingMode = "standard";

export interface AIModelPricing {
  id: string;
  provider: Provider;
  /** Model name as published by the provider. */
  model: string;
  /** Exact identifier passed to the provider's API. */
  modelId: string;

  inputPricePerMillion: number;
  outputPricePerMillion: number;

  currency: Currency;
  pricingMode: PricingMode;

  /**
   * Documents pricing rules that exist for this model but are outside the
   * V0.2 scope. Never left implicit: an unmodelled tier must be stated here.
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
  /** `null` when there is no meaningful baseline (lowest cost is zero). */
  percentageDifference: number | null;
}

export interface CostComparison {
  /** Estimates sorted by total cost, ascending. */
  entries: CostComparisonEntry[];
  lowest: CostEstimate | null;
  highest: CostEstimate | null;
  potentialDifference: number;
  potentialPercentageDifference: number | null;
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

export interface UsagePreset {
  id: string;
  label: string;
  hint: string;
  usage: UsageInput;
}
