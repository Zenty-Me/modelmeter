import type { AIModelPricing, PricingSource } from "./types";

/**
 * PLACEHOLDER DATASET — EVERY ENTRY BELOW IS DEMO DATA.
 *
 * These prices are illustrative only. They were not copied from any
 * provider's official pricing page and must never be presented as real
 * API prices.
 *
 * Before production:
 *   1. Open each provider's official pricing documentation.
 *   2. Copy the standard (non-batch, non-cached) text token price.
 *   3. Replace the numbers below and set `isDemoData: false`.
 */
export const DEMO_PRICING_DATASET: AIModelPricing[] = [
  {
    id: "demo-openai-standard",
    provider: "OpenAI",
    model: "Demo Standard Model",
    inputPricePerMillion: 2,
    outputPricePerMillion: 8,
    currency: "USD",
    sourceName: "OpenAI Official Pricing",
    isDemoData: true,
  },
  {
    id: "demo-openai-lite",
    provider: "OpenAI",
    model: "Demo Lite Model",
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 2,
    currency: "USD",
    sourceName: "OpenAI Official Pricing",
    isDemoData: true,
  },
  {
    id: "demo-anthropic-standard",
    provider: "Anthropic",
    model: "Demo Standard Model",
    inputPricePerMillion: 3,
    outputPricePerMillion: 12,
    currency: "USD",
    sourceName: "Anthropic Official Pricing",
    isDemoData: true,
  },
  {
    id: "demo-anthropic-lite",
    provider: "Anthropic",
    model: "Demo Lite Model",
    inputPricePerMillion: 1,
    outputPricePerMillion: 4,
    currency: "USD",
    sourceName: "Anthropic Official Pricing",
    isDemoData: true,
  },
  {
    id: "demo-gemini-standard",
    provider: "Google",
    model: "Demo Gemini Standard Model",
    inputPricePerMillion: 1.5,
    outputPricePerMillion: 6,
    currency: "USD",
    sourceName: "Google Gemini API Pricing",
    isDemoData: true,
  },
  {
    id: "demo-gemini-lite",
    provider: "Google",
    model: "Demo Gemini Lite Model",
    inputPricePerMillion: 0.35,
    outputPricePerMillion: 1.4,
    currency: "USD",
    sourceName: "Google Gemini API Pricing",
    isDemoData: true,
  },
];

/**
 * Sources are intentionally left without a URL.
 * TODO: verify each provider's official pricing page by hand, then paste the
 * URL here and set `isVerified: true`. Do not link price aggregators.
 */
export const PRICING_SOURCES: PricingSource[] = [
  {
    provider: "OpenAI",
    sourceName: "OpenAI Official Pricing",
    isVerified: false,
  },
  {
    provider: "Anthropic",
    sourceName: "Anthropic Official Pricing",
    isVerified: false,
  },
  {
    provider: "Google",
    sourceName: "Google Gemini API Pricing",
    isVerified: false,
  },
];

/** `null` until a human has reviewed every price against the official docs. */
export const LAST_PRICING_REVIEW: string | null = null;
