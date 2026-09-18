import type { AIModelPricing, PricingSource } from "./types";

/**
 * PRICING DATASET — MANUALLY VERIFIED AGAINST OFFICIAL PROVIDER DOCUMENTATION.
 *
 * Every price below was read from the provider's own pricing documentation on
 * the date recorded in `checkedAt`. No prices are estimated, remembered or
 * taken from third-party aggregators.
 *
 * Scope — standard, on-demand text pricing only:
 *   - batch, flex and fast/priority service tiers are excluded
 *   - prompt caching (reads and writes) is excluded
 *   - tool, search, image, audio and video usage is excluded
 *   - regional and enterprise pricing is excluded
 *
 * Context tiers are expressed as data (`minInputTokens` / `maxInputTokens`) and
 * resolved by `lib/pricing-engine.ts`. Bounds are inclusive, so a 272,000-token
 * request stays on the base tier while 272,001 moves to the long-context tier.
 *
 * To add or refresh a model:
 *   1. Open the provider's official pricing page (see `PRICING_SOURCES`).
 *   2. Read the standard-tier price for input and output tokens.
 *   3. Copy the exact model identifier used by the API into `modelId`.
 *   4. Fill `sourceName`, `sourceUrl`, `checkedAt` and `notes`.
 *   5. Add one entry per published context tier, base tier first.
 */
export const PRICING_DATASET: AIModelPricing[] = [
  {
    id: "openai-gpt-5-6-luna",
    provider: "OpenAI",
    model: "gpt-5.6-luna",
    modelId: "gpt-5.6-luna",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 0.2,
        outputPricePerMillion: 1.2,
        maxInputTokens: 272000,
      },
      {
        id: "long-context",
        label: "Long context",
        badgeLabel: "Long-context pricing",
        inputPricePerMillion: 0.4,
        outputPricePerMillion: 1.8,
        minInputTokens: 272001,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    contextNotes:
      "OpenAI bills requests above the 272K-token context boundary at this model's long-context rate. ModelMeter selects the tier from your average input tokens per request.",
    sourceName: "OpenAI API Pricing",
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Standard service tier. Cached input, Batch, Flex and Fast mode prices are excluded.",
    isDemoData: false,
  },
  {
    id: "openai-gpt-5-6-terra",
    provider: "OpenAI",
    model: "gpt-5.6-terra",
    modelId: "gpt-5.6-terra",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 2,
        outputPricePerMillion: 12,
        maxInputTokens: 272000,
      },
      {
        id: "long-context",
        label: "Long context",
        badgeLabel: "Long-context pricing",
        inputPricePerMillion: 4,
        outputPricePerMillion: 18,
        minInputTokens: 272001,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    contextNotes:
      "OpenAI bills requests above the 272K-token context boundary at this model's long-context rate. ModelMeter selects the tier from your average input tokens per request.",
    sourceName: "OpenAI API Pricing",
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Standard service tier. Cached input, Batch, Flex and Fast mode prices are excluded.",
    isDemoData: false,
  },
  {
    id: "anthropic-claude-sonnet-5",
    provider: "Anthropic",
    model: "Claude Sonnet 5",
    modelId: "claude-sonnet-5",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 2,
        outputPricePerMillion: 10,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    sourceName: "Anthropic Claude API Pricing",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Single published rate — no context-based tier. The $2 / $10 launch price is now the standard price; the previously announced increase to $3 / $15 no longer applies. Prompt caching and the 50% batch discount are excluded.",
    isDemoData: false,
  },
  {
    id: "anthropic-claude-opus-5",
    provider: "Anthropic",
    model: "Claude Opus 5",
    modelId: "claude-opus-5",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 5,
        outputPricePerMillion: 25,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    sourceName: "Anthropic Claude API Pricing",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Single published rate — no context-based tier. Anthropic offers a faster mode at 2x standard pricing and US-only inference at 1.1x; V0.3 compares standard pricing only. Prompt caching and the 50% batch discount are excluded.",
    isDemoData: false,
  },
  {
    id: "google-gemini-3-1-flash-lite",
    provider: "Google",
    model: "Gemini 3.1 Flash-Lite",
    modelId: "gemini-3.1-flash-lite",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 0.25,
        outputPricePerMillion: 1.5,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    sourceName: "Google Gemini API Pricing",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Single published rate — no context-based tier. Input price is the text / image / video rate; audio input is billed at a different rate. A free tier exists but is not part of the comparison. Batch, Flex and Priority tiers are excluded.",
    isDemoData: false,
  },
  {
    id: "google-gemini-3-1-pro-preview",
    provider: "Google",
    model: "Gemini 3.1 Pro Preview",
    modelId: "gemini-3.1-pro-preview",
    pricingTiers: [
      {
        id: "base",
        label: "Standard context",
        inputPricePerMillion: 2,
        outputPricePerMillion: 12,
        maxInputTokens: 200000,
      },
      {
        id: "long-context",
        label: "Long context",
        badgeLabel: "Long-context pricing",
        inputPricePerMillion: 4,
        outputPricePerMillion: 18,
        minInputTokens: 200001,
      },
    ],
    currency: "USD",
    pricingMode: "standard",
    contextNotes:
      "Google bills prompts above 200,000 tokens at this model's higher tier. ModelMeter selects the tier from your average input tokens per request.",
    sourceName: "Google Gemini API Pricing",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    checkedAt: "2026-09-18",
    notes:
      "Output price includes thinking tokens. Preview models may change before general availability. Batch, Flex and Priority tiers are excluded.",
    isDemoData: false,
  },
];

/**
 * Official provider pricing pages backing the dataset.
 * Third-party price aggregators are never used as a source.
 */
export const PRICING_SOURCES: PricingSource[] = [
  {
    provider: "OpenAI",
    sourceName: "OpenAI API Pricing",
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    checkedAt: "2026-09-18",
    isVerified: true,
  },
  {
    provider: "Anthropic",
    sourceName: "Anthropic Claude API Pricing",
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    checkedAt: "2026-09-18",
    isVerified: true,
  },
  {
    provider: "Google",
    sourceName: "Google Gemini API Pricing",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    checkedAt: "2026-09-18",
    isVerified: true,
  },
];

/** Date of the last manual review pass over every price in the dataset. */
export const PRICING_CHECKED_AT = "2026-09-18";
