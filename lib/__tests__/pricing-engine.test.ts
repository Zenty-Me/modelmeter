import { describe, expect, it } from "vitest";

import { PRICING_DATASET } from "../pricing";
import {
  getBaseTier,
  getContextThreshold,
  hasMultipleTiers,
  resolvePricingTier,
} from "../pricing-engine";
import { findModel } from "./test-helpers";

const LUNA = findModel("openai-gpt-5-6-luna");
const TERRA = findModel("openai-gpt-5-6-terra");
const GEMINI_PRO = findModel("google-gemini-3-1-pro-preview");
const FLASH_LITE = findModel("google-gemini-3-1-flash-lite");
const SONNET = findModel("anthropic-claude-sonnet-5");

describe("tier resolution — OpenAI long-context boundary (272,000 tokens)", () => {
  it("keeps exactly 272,000 input tokens on the base tier for GPT-5.6 Luna", () => {
    const tier = resolvePricingTier(LUNA, 272_000);

    expect(tier.id).toBe("base");
    expect(tier.label).toBe("Standard context");
    expect(tier.inputPricePerMillion).toBe(0.2);
    expect(tier.outputPricePerMillion).toBe(1.2);
  });

  it("moves 272,001 input tokens to the long-context tier for GPT-5.6 Luna", () => {
    const tier = resolvePricingTier(LUNA, 272_001);

    expect(tier.id).toBe("long-context");
    expect(tier.label).toBe("Long context");
    expect(tier.badgeLabel).toBe("Long-context pricing");
    expect(tier.inputPricePerMillion).toBe(0.4);
    expect(tier.outputPricePerMillion).toBe(1.8);
  });

  it("keeps exactly 272,000 input tokens on the base tier for GPT-5.6 Terra", () => {
    const tier = resolvePricingTier(TERRA, 272_000);

    expect(tier.id).toBe("base");
    expect(tier.inputPricePerMillion).toBe(2);
    expect(tier.outputPricePerMillion).toBe(12);
  });

  it("moves 272,001 input tokens to the long-context tier for GPT-5.6 Terra", () => {
    const tier = resolvePricingTier(TERRA, 272_001);

    expect(tier.id).toBe("long-context");
    expect(tier.inputPricePerMillion).toBe(4);
    expect(tier.outputPricePerMillion).toBe(18);
  });
});

describe("tier resolution — Gemini long-context boundary (200,000 tokens)", () => {
  it("keeps exactly 200,000 input tokens on the base tier", () => {
    const tier = resolvePricingTier(GEMINI_PRO, 200_000);

    expect(tier.id).toBe("base");
    expect(tier.inputPricePerMillion).toBe(2);
    expect(tier.outputPricePerMillion).toBe(12);
  });

  it("moves 200,001 input tokens to the long-context tier", () => {
    const tier = resolvePricingTier(GEMINI_PRO, 200_001);

    expect(tier.id).toBe("long-context");
    expect(tier.inputPricePerMillion).toBe(4);
    expect(tier.outputPricePerMillion).toBe(18);
  });

  it("uses a different threshold from the OpenAI models", () => {
    // 250,000 is above Google's boundary but still below OpenAI's.
    expect(resolvePricingTier(GEMINI_PRO, 250_000).id).toBe("long-context");
    expect(resolvePricingTier(LUNA, 250_000).id).toBe("base");
  });
});

describe("tier resolution — models with a single published rate", () => {
  it("always returns the base tier for Gemini 3.1 Flash-Lite", () => {
    for (const tokens of [0, 1_000, 200_000, 1_000_000, 10_000_000]) {
      const tier = resolvePricingTier(FLASH_LITE, tokens);

      expect(tier.id).toBe("base");
      expect(tier.inputPricePerMillion).toBe(0.25);
      expect(tier.outputPricePerMillion).toBe(1.5);
    }
  });

  it("always returns the base tier for Claude Sonnet 5, which has no upper bound", () => {
    const tier = resolvePricingTier(SONNET, 10_000_000);

    expect(tier.id).toBe("base");
    expect(tier.inputPricePerMillion).toBe(2);
    expect(tier.outputPricePerMillion).toBe(10);
  });

  it("reports which models have more than one tier", () => {
    expect(hasMultipleTiers(LUNA)).toBe(true);
    expect(hasMultipleTiers(TERRA)).toBe(true);
    expect(hasMultipleTiers(GEMINI_PRO)).toBe(true);
    expect(hasMultipleTiers(FLASH_LITE)).toBe(false);
    expect(hasMultipleTiers(SONNET)).toBe(false);
  });
});

describe("tier resolution — token counts that are not usable numbers", () => {
  it("treats zero, negative and non-finite counts as zero and resolves the base tier", () => {
    for (const tokens of [0, -1, -1_000_000, Number.NaN, Number.POSITIVE_INFINITY]) {
      const tier = resolvePricingTier(LUNA, tokens);

      expect(tier.id).toBe("base");
    }
  });

  it("never returns undefined — every model in the dataset resolves to a tier", () => {
    for (const model of PRICING_DATASET) {
      for (const tokens of [0, 1, 1e9, Number.NaN]) {
        expect(resolvePricingTier(model, tokens)).toBeDefined();
      }
    }
  });
});

describe("context threshold reporting", () => {
  it("reads the published threshold from the base tier's upper bound", () => {
    expect(getContextThreshold(LUNA)).toBe(272_000);
    expect(getContextThreshold(TERRA)).toBe(272_000);
    expect(getContextThreshold(GEMINI_PRO)).toBe(200_000);
  });

  it("returns null for models published at a single rate", () => {
    expect(getContextThreshold(FLASH_LITE)).toBeNull();
    expect(getContextThreshold(SONNET)).toBeNull();
  });

  it("matches the threshold that actually moves the resolver to the next tier", () => {
    for (const model of PRICING_DATASET) {
      const threshold = getContextThreshold(model);

      if (threshold === null) {
        expect(resolvePricingTier(model, Number.MAX_SAFE_INTEGER).id).toBe("base");
        continue;
      }

      expect(resolvePricingTier(model, threshold).id).toBe("base");
      expect(resolvePricingTier(model, threshold + 1).id).not.toBe("base");
    }
  });
});

describe("pricing dataset invariants", () => {
  it("is never empty and every model has a base tier first", () => {
    expect(PRICING_DATASET.length).toBeGreaterThan(0);

    for (const model of PRICING_DATASET) {
      expect(model.pricingTiers.length).toBeGreaterThan(0);
      expect(getBaseTier(model)).toBe(model.pricingTiers[0]);
      expect(model.isDemoData).toBe(false);
    }
  });

  it("never leaves a gap between consecutive tiers", () => {
    for (const model of PRICING_DATASET) {
      const tiers = model.pricingTiers;

      for (let index = 1; index < tiers.length; index += 1) {
        const previousMax = tiers[index - 1].maxInputTokens;
        const currentMin = tiers[index].minInputTokens;

        expect(previousMax).toBeTypeOf("number");
        expect(currentMin).toBeTypeOf("number");

        if (typeof previousMax !== "number" || typeof currentMin !== "number") {
          continue;
        }

        // Bounds are inclusive, so the next tier starts one token later.
        expect(currentMin).toBe(previousMax + 1);
      }
    }
  });
});
