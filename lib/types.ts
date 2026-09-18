export type Currency = "USD";

export type Provider = "OpenAI" | "Anthropic" | "Google";

export interface AIModelPricing {
  id: string;
  provider: Provider;
  model: string;

  inputPricePerMillion: number;
  outputPricePerMillion: number;

  currency: Currency;

  sourceName: string;
  /** TODO: fill once the official pricing page has been reviewed manually. */
  sourceUrl?: string;
  checkedAt?: string;

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

export interface PricingSource {
  provider: Provider;
  sourceName: string;
  /** TODO: fill once the official pricing page has been reviewed manually. */
  sourceUrl?: string;
  checkedAt?: string;
  isVerified: boolean;
}

export interface UsagePreset {
  id: string;
  label: string;
  hint: string;
  usage: UsageInput;
}
