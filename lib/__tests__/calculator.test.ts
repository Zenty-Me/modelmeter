import { describe, expect, it } from "vitest";

import {
  calculateAllModelEstimates,
  calculateInputCost,
  calculateModelEstimate,
  calculateMonthlyTokens,
  calculateOutputCost,
  calculateTotalCost,
  normalizeUsage,
  parseUsageDraft,
  parseUsageValue,
  sortEstimatesByCost,
  toUsageDraft,
} from "../calculator";
import { PRICING_DATASET } from "../pricing";
import { DEFAULT_USAGE } from "../presets";
import type { PricingTier, UsageInput } from "../types";
import { findModel } from "./test-helpers";

const SONNET = findModel("anthropic-claude-sonnet-5");

/** $2 in / $10 out per 1M tokens — Claude Sonnet 5's published rate. */
const TWO_TEN_TIER: PricingTier = {
  id: "base",
  label: "Standard context",
  inputPricePerMillion: 2,
  outputPricePerMillion: 10,
};

describe("monthly token volume", () => {
  it("multiplies requests by tokens per request", () => {
    expect(
      calculateMonthlyTokens({
        monthlyRequests: 100_000,
        inputTokensPerRequest: 2_000,
        outputTokensPerRequest: 500,
      }),
    ).toEqual({
      inputTokens: 200_000_000,
      outputTokens: 50_000_000,
      totalTokens: 250_000_000,
    });
  });

  it("is the sum of the input and output volumes", () => {
    const tokens = calculateMonthlyTokens(DEFAULT_USAGE);

    expect(tokens.totalTokens).toBe(tokens.inputTokens + tokens.outputTokens);
  });
});

describe("basic cost calculation — $2 / $10 per 1M tokens", () => {
  const usage: UsageInput = {
    monthlyRequests: 100_000,
    inputTokensPerRequest: 2_000,
    outputTokensPerRequest: 500,
  };

  it("prices 200M input tokens at $400", () => {
    expect(calculateInputCost(200_000_000, TWO_TEN_TIER)).toBe(400);
  });

  it("prices 50M output tokens at $500", () => {
    expect(calculateOutputCost(50_000_000, TWO_TEN_TIER)).toBe(500);
  });

  it("adds up to $900 for the month", () => {
    expect(calculateTotalCost(400, 500)).toBe(900);
  });

  it("produces the same figures through the model estimate", () => {
    const estimate = calculateModelEstimate(SONNET, usage);

    expect(estimate.tier.id).toBe("base");
    expect(estimate.inputTokensPerRequest).toBe(2_000);
    expect(estimate.monthlyTokens).toEqual({
      inputTokens: 200_000_000,
      outputTokens: 50_000_000,
      totalTokens: 250_000_000,
    });
    expect(estimate.inputCost).toBe(400);
    expect(estimate.outputCost).toBe(500);
    expect(estimate.totalCost).toBe(900);
    expect(estimate.currency).toBe("USD");
  });

  it("charges nothing for a zero-token volume", () => {
    expect(calculateInputCost(0, TWO_TEN_TIER)).toBe(0);
    expect(calculateOutputCost(0, TWO_TEN_TIER)).toBe(0);
    expect(calculateTotalCost(0, 0)).toBe(0);
  });

  it("scales linearly with volume", () => {
    // Half the volume, half the cost.
    expect(calculateInputCost(100_000_000, TWO_TEN_TIER)).toBe(200);
    expect(calculateOutputCost(25_000_000, TWO_TEN_TIER)).toBe(250);
  });
});

describe("estimating every model in the dataset", () => {
  const estimates = calculateAllModelEstimates(PRICING_DATASET, DEFAULT_USAGE);

  it("returns one estimate per model", () => {
    expect(estimates).toHaveLength(PRICING_DATASET.length);
    expect(estimates.map((estimate) => estimate.model.id)).toEqual(
      PRICING_DATASET.map((model) => model.id),
    );
  });

  it("reports every estimate in USD and never a negative cost", () => {
    for (const estimate of estimates) {
      expect(estimate.currency).toBe("USD");
      expect(estimate.inputCost).toBeGreaterThanOrEqual(0);
      expect(estimate.outputCost).toBeGreaterThanOrEqual(0);
      expect(estimate.totalCost).toBeGreaterThanOrEqual(0);
      expect(estimate.totalCost).toBeCloseTo(
        estimate.inputCost + estimate.outputCost,
        10,
      );
    }
  });

  it("selects the tier from the usage, not from the model name", () => {
    const longRequestUsage: UsageInput = {
      monthlyRequests: 1_000,
      inputTokensPerRequest: 300_000,
      outputTokensPerRequest: 500,
    };

    const longContextIds = calculateAllModelEstimates(
      PRICING_DATASET,
      longRequestUsage,
    )
      .filter((estimate) => estimate.tier.id === "long-context")
      .map((estimate) => estimate.model.id);

    expect(longContextIds).toEqual([
      "openai-gpt-5-6-luna",
      "openai-gpt-5-6-terra",
      "google-gemini-3-1-pro-preview",
    ]);
  });
});

describe("ranking estimates by cost", () => {
  it("sorts ascending without mutating the input array", () => {
    const estimates = calculateAllModelEstimates(PRICING_DATASET, DEFAULT_USAGE);
    const originalOrder = estimates.map((estimate) => estimate.model.id);

    const sorted = sortEstimatesByCost(estimates);

    expect(sorted).toHaveLength(estimates.length);
    expect(estimates.map((estimate) => estimate.model.id)).toEqual(originalOrder);

    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index].totalCost).toBeGreaterThanOrEqual(
        sorted[index - 1].totalCost,
      );
    }
  });
});

describe("parsing raw form values", () => {
  it("reads a plain number", () => {
    expect(parseUsageValue("100000")).toBe(100_000);
    expect(parseUsageValue("2000")).toBe(2_000);
  });

  it("ignores surrounding whitespace", () => {
    expect(parseUsageValue("  12345  ")).toBe(12_345);
  });

  it("treats an empty or whitespace-only field as zero", () => {
    expect(parseUsageValue("")).toBe(0);
    expect(parseUsageValue("   ")).toBe(0);
  });

  it("treats non-numeric text as zero", () => {
    expect(parseUsageValue("abc")).toBe(0);
    expect(parseUsageValue("12abc")).toBe(0);
  });

  it("treats a negative field as zero", () => {
    expect(parseUsageValue("-100")).toBe(0);
  });

  it("accepts scientific notation", () => {
    expect(parseUsageValue("1e3")).toBe(1_000);
  });

  it("caps an infinite field instead of leaking Infinity", () => {
    expect(parseUsageValue("Infinity")).toBe(1e12);
  });

  it("parses a whole draft", () => {
    expect(
      parseUsageDraft({
        monthlyRequests: "100000",
        inputTokensPerRequest: "2000",
        outputTokensPerRequest: "500",
      }),
    ).toEqual(DEFAULT_USAGE);
  });

  it("round-trips through the draft shape", () => {
    expect(parseUsageDraft(toUsageDraft(DEFAULT_USAGE))).toEqual(DEFAULT_USAGE);
  });
});

describe("normalising usage coming from anywhere but the form", () => {
  it("leaves valid usage untouched", () => {
    expect(normalizeUsage(DEFAULT_USAGE)).toEqual(DEFAULT_USAGE);
  });

  it("replaces NaN, negatives and Infinity with usable numbers", () => {
    expect(
      normalizeUsage({
        monthlyRequests: Number.NaN,
        inputTokensPerRequest: -1,
        outputTokensPerRequest: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({
      monthlyRequests: 0,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 1e12,
    });
  });
});
