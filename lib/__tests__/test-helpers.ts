import { PRICING_DATASET } from "../pricing";
import { findPresetById } from "../presets";
import type {
  AIModelPricing,
  CostEstimate,
  PricingTier,
  UsageInput,
  UsagePreset,
} from "../types";

/**
 * Shared fixtures for the unit tests. Deliberately imports nothing from the
 * test runner so that it stays a plain module.
 */

/** Looks a model up by dataset id and fails loudly if it ever disappears. */
export function findModel(id: string): AIModelPricing {
  const model = PRICING_DATASET.find((entry) => entry.id === id);

  if (!model) throw new Error(`Pricing dataset is missing model "${id}"`);

  return model;
}

/** Looks a preset up by id and fails loudly if it ever disappears. */
export function presetById(id: string): UsagePreset {
  const preset = findPresetById(id);

  if (!preset) throw new Error(`Preset not found: "${id}"`);

  return preset;
}

/** Just the three usage fields, without a preset's own metadata. */
export function usageOf(preset: UsagePreset): UsageInput {
  const { monthlyRequests, inputTokensPerRequest, outputTokensPerRequest } =
    preset;

  return { monthlyRequests, inputTokensPerRequest, outputTokensPerRequest };
}

const SYNTHETIC_TIER: PricingTier = {
  id: "base",
  label: "Standard context",
  inputPricePerMillion: 1,
  outputPricePerMillion: 1,
};

/**
 * Builds an estimate with an exact `totalCost`.
 *
 * Comparison maths is about the relationship between costs, so the regression
 * cases use the round figures from the bug reports directly instead of
 * reverse-engineering a usage input that happens to produce them.
 */
export function makeEstimate(id: string, totalCost: number): CostEstimate {
  const model: AIModelPricing = {
    id,
    provider: "OpenAI",
    model: id,
    modelId: id,
    pricingTiers: [SYNTHETIC_TIER],
    currency: "USD",
    pricingMode: "standard",
    sourceName: "test fixture",
    sourceUrl: "https://example.com/pricing",
    checkedAt: "2026-09-18",
    isDemoData: false,
  };

  return {
    model,
    tier: SYNTHETIC_TIER,
    inputTokensPerRequest: 0,
    monthlyTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    inputCost: totalCost,
    outputCost: 0,
    totalCost,
    currency: "USD",
  };
}
