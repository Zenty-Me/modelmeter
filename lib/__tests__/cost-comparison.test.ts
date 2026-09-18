import { describe, expect, it } from "vitest";

import {
  calculateAllModelEstimates,
  calculateCostComparison,
} from "../calculator";
import { formatPercentage } from "../format";
import { PRICING_DATASET } from "../pricing";
import type { UsageInput } from "../types";
import { makeEstimate } from "./test-helpers";

describe("lowest-cost model regression — 300K-token requests", () => {
  const usage: UsageInput = {
    monthlyRequests: 10_000,
    inputTokensPerRequest: 300_000,
    outputTokensPerRequest: 1_000,
  };

  const estimates = calculateAllModelEstimates(PRICING_DATASET, usage);
  const comparison = calculateCostComparison(estimates);

  const costOf = (modelId: string): number => {
    const estimate = estimates.find((entry) => entry.model.id === modelId);
    if (!estimate) throw new Error(`Missing estimate for ${modelId}`);

    return estimate.totalCost;
  };

  it("applies GPT-5.6 Luna's long-context tier at 300K input tokens per request", () => {
    const luna = estimates.find(
      (entry) => entry.model.id === "openai-gpt-5-6-luna",
    );

    expect(luna?.tier.id).toBe("long-context");
    // 10,000 × 300,000 = 3B input tokens at $0.40 + 10M output tokens at $1.80
    expect(costOf("openai-gpt-5-6-luna")).toBe(1_218);
  });

  it("prices Gemini 3.1 Flash-Lite at its single standard rate", () => {
    const flashLite = estimates.find(
      (entry) => entry.model.id === "google-gemini-3-1-flash-lite",
    );

    expect(flashLite?.tier.id).toBe("base");
    // 3B input tokens at $0.25 + 10M output tokens at $1.50
    expect(costOf("google-gemini-3-1-flash-lite")).toBe(765);
  });

  it("keeps Gemini 3.1 Flash-Lite cheaper than GPT-5.6 Luna", () => {
    // This is the regression that matters: on the base tier Luna would cost
    // $612 and win. Only the long-context tier makes the cheap model cheaper.
    expect(costOf("google-gemini-3-1-flash-lite")).toBeLessThan(
      costOf("openai-gpt-5-6-luna"),
    );
    expect(comparison.lowest?.model.id).toBe("google-gemini-3-1-flash-lite");
  });

  it("ranks the whole dataset from cheapest to most expensive", () => {
    expect(comparison.entries.map((entry) => entry.estimate.model.id)).toEqual([
      "google-gemini-3-1-flash-lite",
      "openai-gpt-5-6-luna",
      "anthropic-claude-sonnet-5",
      "openai-gpt-5-6-terra",
      "google-gemini-3-1-pro-preview",
      "anthropic-claude-opus-5",
    ]);
  });

  it("reports the spread between the cheapest and the most expensive option", () => {
    expect(comparison.savingsAmount).toBe(15_250 - 765);
    expect(comparison.hasCostRange).toBe(true);
  });
});

describe("savings percentage", () => {
  it("divides by the highest cost — $2,250 down to $100 saves 95.555…%", () => {
    const comparison = calculateCostComparison([
      makeEstimate("expensive", 2_250),
      makeEstimate("cheap", 100),
    ]);

    expect(comparison.savingsAmount).toBe(2_150);
    // (2250 - 100) / 2250 × 100
    expect(comparison.savingsPercentage).toBeCloseTo(95.555_555_555_555_56, 10);
    expect(formatPercentage(comparison.savingsPercentage)).toBe("95.6%");
  });

  it("divides by the highest cost — $1,000 down to $250 saves 75%", () => {
    const comparison = calculateCostComparison([
      makeEstimate("expensive", 1_000),
      makeEstimate("cheap", 250),
    ]);

    expect(comparison.savingsAmount).toBe(750);
    expect(comparison.savingsPercentage).toBe(75);
    expect(formatPercentage(comparison.savingsPercentage)).toBe("75%");
  });

  it("never reports 300% or any figure above 100%", () => {
    const cases: [highest: number, lowest: number][] = [
      [2_250, 100],
      [1_000, 250],
      [300, 100],
      [1_000_000, 1],
      [900, 900],
      [100, 0],
    ];

    for (const [highest, lowest] of cases) {
      const comparison = calculateCostComparison([
        makeEstimate("expensive", highest),
        makeEstimate("cheap", lowest),
      ]);

      expect(Number.isFinite(comparison.savingsPercentage)).toBe(true);
      expect(comparison.savingsPercentage).toBeGreaterThanOrEqual(0);
      expect(comparison.savingsPercentage).toBeLessThanOrEqual(100);
    }
  });

  it("is 100% when the cheapest option is free", () => {
    const comparison = calculateCostComparison([
      makeEstimate("expensive", 900),
      makeEstimate("cheap", 0),
    ]);

    expect(comparison.savingsPercentage).toBe(100);
    expect(comparison.savingsAmount).toBe(900);
  });

  it("is 0% when every model costs the same", () => {
    const comparison = calculateCostComparison([
      makeEstimate("a", 900),
      makeEstimate("b", 900),
    ]);

    expect(comparison.savingsPercentage).toBe(0);
    expect(comparison.savingsAmount).toBe(0);
    expect(comparison.hasCostRange).toBe(false);
  });

  it("is 0% when there is nothing to compare", () => {
    const empty = calculateCostComparison([]);

    expect(empty.entries).toEqual([]);
    expect(empty.lowest).toBeNull();
    expect(empty.highest).toBeNull();
    expect(empty.savingsPercentage).toBe(0);
    expect(empty.savingsAmount).toBe(0);
    expect(empty.hasCostRange).toBe(false);
  });

  it("is 0% rather than NaN when a cost is not a usable number", () => {
    const comparison = calculateCostComparison([
      makeEstimate("broken", Number.POSITIVE_INFINITY),
      makeEstimate("cheap", 100),
    ]);

    expect(Number.isFinite(comparison.savingsPercentage)).toBe(true);
    expect(comparison.savingsPercentage).toBe(0);
    expect(Number.isFinite(comparison.savingsAmount)).toBe(true);
  });
});

describe("how much pricier than the cheapest — a different question", () => {
  const comparison = calculateCostComparison([
    makeEstimate("cheap", 100),
    makeEstimate("expensive", 300),
  ]);

  const entryFor = (id: string) => {
    const entry = comparison.entries.find((item) => item.estimate.model.id === id);
    if (!entry) throw new Error(`Missing comparison entry for ${id}`);

    return entry;
  };

  it("divides by the lowest cost and is allowed to exceed 100%", () => {
    // (300 - 100) / 100 × 100
    expect(entryFor("expensive").higherThanLowestPercentage).toBe(200);
    expect(entryFor("expensive").absoluteDifference).toBe(200);
  });

  it("keeps the two percentages distinct", () => {
    // The saving divides by the highest cost, this one by the lowest.
    expect(comparison.savingsPercentage).toBeCloseTo(66.666_666_666_666_66, 10);
    expect(entryFor("expensive").higherThanLowestPercentage).toBe(200);
  });

  it("marks the cheapest entry and gives it a zero difference", () => {
    expect(entryFor("cheap").isLowestCost).toBe(true);
    expect(entryFor("cheap").absoluteDifference).toBe(0);
    expect(entryFor("cheap").higherThanLowestPercentage).toBe(0);
    expect(entryFor("expensive").isLowestCost).toBe(false);
  });

  it("returns null for the percentage when the cheapest cost is zero", () => {
    const zeroBaseline = calculateCostComparison([
      makeEstimate("free", 0),
      makeEstimate("paid", 500),
    ]);
    const paid = zeroBaseline.entries.find(
      (entry) => entry.estimate.model.id === "paid",
    );

    expect(paid?.absoluteDifference).toBe(500);
    expect(paid?.higherThanLowestPercentage).toBeNull();
    expect(zeroBaseline.savingsPercentage).toBe(100);
  });
});

describe("comparison of a single estimate", () => {
  it("treats it as both the cheapest and the most expensive", () => {
    const comparison = calculateCostComparison([makeEstimate("only", 900)]);

    expect(comparison.lowest?.model.id).toBe("only");
    expect(comparison.highest?.model.id).toBe("only");
    expect(comparison.savingsAmount).toBe(0);
    expect(comparison.savingsPercentage).toBe(0);
    expect(comparison.hasCostRange).toBe(false);
    expect(comparison.entries[0].isLowestCost).toBe(true);
  });
});

describe("zero usage", () => {
  it("produces a flat comparison instead of claiming a winner", () => {
    const estimates = calculateAllModelEstimates(PRICING_DATASET, {
      monthlyRequests: 0,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 0,
    });
    const comparison = calculateCostComparison(estimates);

    expect(estimates.every((estimate) => estimate.totalCost === 0)).toBe(true);
    expect(comparison.savingsAmount).toBe(0);
    expect(comparison.savingsPercentage).toBe(0);
    expect(comparison.hasCostRange).toBe(false);
  });
});
