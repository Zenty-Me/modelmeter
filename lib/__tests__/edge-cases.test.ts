import { describe, expect, it } from "vitest";

import {
  calculateAllModelEstimates,
  calculateCostComparison,
  calculateInputCost,
  calculateModelEstimate,
  calculateMonthlyTokens,
  calculateOutputCost,
  calculateTotalCost,
  normalizeUsage,
  parseUsageValue,
} from "../calculator";
import { formatCurrency, formatNumber } from "../format";
import { PRICING_DATASET } from "../pricing";
import { resolvePricingTier } from "../pricing-engine";
import type { AIModelPricing, PricingTier, UsageInput } from "../types";
import { findModel } from "./test-helpers";

const SONNET = findModel("anthropic-claude-sonnet-5");

/** $2 in / $10 out per 1M tokens. */
const TIER: PricingTier = {
  id: "base",
  label: "Standard context",
  inputPricePerMillion: 2,
  outputPricePerMillion: 10,
};

/**
 * The calculator's documented ceiling for a value that flows through to the
 * UI. Anything larger is normalised down to it so `Infinity` never renders.
 */
const MAX_VALUE = 1e12;

const MAXED_USAGE: UsageInput = {
  monthlyRequests: MAX_VALUE,
  inputTokensPerRequest: MAX_VALUE,
  outputTokensPerRequest: MAX_VALUE,
};

const HOSTILE_USAGE: UsageInput[] = [
  { monthlyRequests: 0, inputTokensPerRequest: 0, outputTokensPerRequest: 0 },
  { monthlyRequests: 1, inputTokensPerRequest: 0, outputTokensPerRequest: 0 },
  { monthlyRequests: 0, inputTokensPerRequest: 1_000, outputTokensPerRequest: 1_000 },
  { monthlyRequests: -1, inputTokensPerRequest: -1, outputTokensPerRequest: -1 },
  {
    monthlyRequests: -1_000_000,
    inputTokensPerRequest: -1_000_000,
    outputTokensPerRequest: -1_000_000,
  },
  {
    monthlyRequests: Number.NaN,
    inputTokensPerRequest: Number.NaN,
    outputTokensPerRequest: Number.NaN,
  },
  {
    monthlyRequests: Number.POSITIVE_INFINITY,
    inputTokensPerRequest: Number.POSITIVE_INFINITY,
    outputTokensPerRequest: Number.POSITIVE_INFINITY,
  },
  {
    monthlyRequests: Number.NEGATIVE_INFINITY,
    inputTokensPerRequest: Number.NEGATIVE_INFINITY,
    outputTokensPerRequest: Number.NEGATIVE_INFINITY,
  },
  { monthlyRequests: 1e9, inputTokensPerRequest: 1e9, outputTokensPerRequest: 1e9 },
  MAXED_USAGE,
];

/** Collects every number that could reach the UI for a single estimate. */
function estimateNumbers(estimate: ReturnType<typeof calculateModelEstimate>) {
  return {
    inputTokensPerRequest: estimate.inputTokensPerRequest,
    inputTokens: estimate.monthlyTokens.inputTokens,
    outputTokens: estimate.monthlyTokens.outputTokens,
    totalTokens: estimate.monthlyTokens.totalTokens,
    inputCost: estimate.inputCost,
    outputCost: estimate.outputCost,
    totalCost: estimate.totalCost,
  };
}

/** Asserts a value is renderable: finite, non-negative and within the ceiling. */
function expectUsableNumber(value: number, label: string) {
  expect(Number.isFinite(value), `${label} must be finite, got ${value}`).toBe(true);
  expect(value, `${label} must not be negative`).toBeGreaterThanOrEqual(0);
  expect(value, `${label} must stay within the ceiling`).toBeLessThanOrEqual(MAX_VALUE);
}

describe("zero usage", () => {
  const zeroUsage: UsageInput = {
    monthlyRequests: 0,
    inputTokensPerRequest: 0,
    outputTokensPerRequest: 0,
  };

  it("produces zero tokens and zero cost", () => {
    expect(calculateMonthlyTokens(zeroUsage)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });

    const estimate = calculateModelEstimate(SONNET, zeroUsage);

    expect(estimate.inputCost).toBe(0);
    expect(estimate.outputCost).toBe(0);
    expect(estimate.totalCost).toBe(0);
  });

  it("still resolves a tier, so the card can explain itself", () => {
    expect(calculateModelEstimate(SONNET, zeroUsage).tier.id).toBe("base");
  });

  it("formats as zero rather than an empty string", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatNumber(0)).toBe("0");
  });

  it("treats zero requests as zero cost for every model", () => {
    const estimates = calculateAllModelEstimates(PRICING_DATASET, zeroUsage);

    for (const estimate of estimates) {
      expect(estimate.monthlyTokens.inputTokens).toBe(0);
      expect(estimate.monthlyTokens.outputTokens).toBe(0);
      expect(estimate.totalCost).toBe(0);
    }

    expect(calculateCostComparison(estimates).hasCostRange).toBe(false);
  });
});

describe("one side of the usage being zero", () => {
  it("charges only for output when the input volume is zero", () => {
    const estimate = calculateModelEstimate(SONNET, {
      monthlyRequests: 1_000,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 1_000,
    });

    expect(estimate.inputCost).toBe(0);
    expect(estimate.outputCost).toBe(10);
    expect(estimate.totalCost).toBe(10);
  });

  it("charges only for input when the output volume is zero", () => {
    const estimate = calculateModelEstimate(SONNET, {
      monthlyRequests: 1_000,
      inputTokensPerRequest: 1_000,
      outputTokensPerRequest: 0,
    });

    expect(estimate.inputCost).toBe(2);
    expect(estimate.outputCost).toBe(0);
    expect(estimate.totalCost).toBe(2);
  });

  it("treats zero requests as zero regardless of the per-request tokens", () => {
    const tokens = calculateMonthlyTokens({
      monthlyRequests: 0,
      inputTokensPerRequest: 500_000,
      outputTokensPerRequest: 500_000,
    });

    expect(tokens).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });
});

describe("negative values", () => {
  it("parses a negative field as zero", () => {
    expect(parseUsageValue("-1")).toBe(0);
    expect(parseUsageValue("-1000000")).toBe(0);
  });

  it("normalises a negative usage to zero", () => {
    expect(
      normalizeUsage({
        monthlyRequests: -1,
        inputTokensPerRequest: -2_000,
        outputTokensPerRequest: -500,
      }),
    ).toEqual({
      monthlyRequests: 0,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 0,
    });
  });

  it("never returns a negative cost from the low-level functions", () => {
    expect(calculateInputCost(-1_000_000, TIER)).toBe(0);
    expect(calculateOutputCost(-1_000_000, TIER)).toBe(0);
    expect(calculateTotalCost(-400, -500)).toBe(0);
    expect(calculateTotalCost(-400, 500)).toBe(500);
  });

  it("produces zero tokens for a negative usage", () => {
    expect(
      calculateMonthlyTokens({
        monthlyRequests: -10,
        inputTokensPerRequest: -10,
        outputTokensPerRequest: -10,
      }),
    ).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });
});

describe("NaN", () => {
  it("parses a non-numeric field as zero", () => {
    expect(parseUsageValue("abc")).toBe(0);
    expect(parseUsageValue("")).toBe(0);
  });

  it("normalises a NaN usage to zero", () => {
    expect(
      normalizeUsage({
        monthlyRequests: Number.NaN,
        inputTokensPerRequest: Number.NaN,
        outputTokensPerRequest: Number.NaN,
      }),
    ).toEqual({
      monthlyRequests: 0,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 0,
    });
  });

  it("never propagates NaN through a cost calculation", () => {
    expect(calculateInputCost(Number.NaN, TIER)).toBe(0);
    expect(calculateOutputCost(Number.NaN, TIER)).toBe(0);
    expect(calculateTotalCost(Number.NaN, 500)).toBe(500);
    expect(calculateTotalCost(Number.NaN, Number.NaN)).toBe(0);
  });

  it("resolves a usable tier for a NaN token count", () => {
    expect(resolvePricingTier(SONNET, Number.NaN).id).toBe("base");
  });

  it("formats NaN as zero", () => {
    expect(formatCurrency(Number.NaN)).toBe("$0.00");
    expect(formatNumber(Number.NaN)).toBe("0");
  });
});

describe("Infinity", () => {
  it("caps an infinite field at the documented ceiling", () => {
    expect(parseUsageValue("Infinity")).toBe(MAX_VALUE);
    expect(
      normalizeUsage({
        monthlyRequests: Number.POSITIVE_INFINITY,
        inputTokensPerRequest: Number.POSITIVE_INFINITY,
        outputTokensPerRequest: Number.POSITIVE_INFINITY,
      }),
    ).toEqual(MAXED_USAGE);
  });

  it("returns a finite token volume for an infinite usage", () => {
    const tokens = calculateMonthlyTokens({
      monthlyRequests: Number.POSITIVE_INFINITY,
      inputTokensPerRequest: Number.POSITIVE_INFINITY,
      outputTokensPerRequest: Number.POSITIVE_INFINITY,
    });

    for (const [label, value] of Object.entries(tokens)) {
      expectUsableNumber(value, label);
    }
  });

  it("returns a finite cost for an infinite token count", () => {
    expectUsableNumber(calculateInputCost(Number.POSITIVE_INFINITY, TIER), "inputCost");
    expectUsableNumber(
      calculateOutputCost(Number.POSITIVE_INFINITY, TIER),
      "outputCost",
    );
    expectUsableNumber(
      calculateTotalCost(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
      "totalCost",
    );
  });

  it("formats Infinity as zero", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("$0.00");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("very large finite numbers", () => {
  it("keeps typed values at the top of the range intact", () => {
    expect(parseUsageValue("1000000000000")).toBe(MAX_VALUE);
  });

  it("caps a product that would overflow the ceiling", () => {
    const tokens = calculateMonthlyTokens({
      monthlyRequests: MAX_VALUE,
      inputTokensPerRequest: MAX_VALUE,
      outputTokensPerRequest: MAX_VALUE,
    });

    for (const [label, value] of Object.entries(tokens)) {
      expectUsableNumber(value, label);
    }
    expect(tokens.inputTokens).toBe(MAX_VALUE);
    expect(tokens.totalTokens).toBe(MAX_VALUE);
  });

  it("caps a cost built from an oversized token count", () => {
    const cost = calculateInputCost(MAX_VALUE * 1_000, TIER);

    expectUsableNumber(cost, "inputCost");
    expect(cost).toBe((MAX_VALUE / 1_000_000) * 2);
  });
});

describe("no unusable number ever reaches the UI-facing estimate", () => {
  const datasetCases = PRICING_DATASET.map(
    (model) => [model.id, model] as [string, AIModelPricing],
  );

  it.each(datasetCases)(
    "keeps every field of the %s estimate renderable",
    (_id, model) => {
      for (const usage of HOSTILE_USAGE) {
        const estimate = calculateModelEstimate(model, usage);
        const numbers = estimateNumbers(estimate);

        for (const [label, value] of Object.entries(numbers)) {
          expectUsableNumber(value, label);
        }

        expect(estimate.totalCost).toBeCloseTo(
          estimate.inputCost + estimate.outputCost,
          10,
        );
        expect(estimate.tier).toBeDefined();
        expect(estimate.currency).toBe("USD");
      }
    },
  );

  it.each(datasetCases)(
    "keeps the %s comparison summary renderable",
    (_id, model) => {
      for (const usage of HOSTILE_USAGE) {
        const comparison = calculateCostComparison([
          calculateModelEstimate(model, usage),
        ]);

        expect(Number.isFinite(comparison.savingsPercentage)).toBe(true);
        expect(comparison.savingsPercentage).toBeGreaterThanOrEqual(0);
        expect(comparison.savingsPercentage).toBeLessThanOrEqual(100);
        expectUsableNumber(comparison.savingsAmount, "savingsAmount");

        for (const entry of comparison.entries) {
          expectUsableNumber(entry.absoluteDifference, "absoluteDifference");

          if (entry.higherThanLowestPercentage !== null) {
            expect(Number.isFinite(entry.higherThanLowestPercentage)).toBe(true);
          }
        }
      }
    },
  );

  it("does not crash on a hostile usage mix across the whole dataset", () => {
    for (const usage of HOSTILE_USAGE) {
      const estimates = calculateAllModelEstimates(PRICING_DATASET, usage);
      const comparison = calculateCostComparison(estimates);

      expect(estimates).toHaveLength(PRICING_DATASET.length);
      expect(Number.isFinite(comparison.savingsPercentage)).toBe(true);
      expect(Number.isFinite(comparison.savingsAmount)).toBe(true);
    }
  });
});
