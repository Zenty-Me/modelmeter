import { describe, expect, it } from "vitest";

import {
  calculateAllModelEstimates,
  calculateCostComparison,
  calculateModelEstimate,
  parseUsageDraft,
  toUsageDraft,
} from "../calculator";
import {
  CUSTOM_SCENARIO_ID,
  DEFAULT_USAGE,
  SCENARIO_PRESETS,
  SIZE_PRESETS,
  matchScenarioPresetId,
  matchSizePresetId,
  resolveScenarioPresetId,
} from "../presets";
import { PRICING_DATASET } from "../pricing";
import { getContextThreshold, resolvePricingTier } from "../pricing-engine";
import type { UsageInput, UsagePreset } from "../types";
import { buildCalculatorSearch, parseCalculatorSearch } from "../url-state";
import { findModel, presetById, usageOf } from "./test-helpers";

const ALL_PRESETS: UsagePreset[] = [...SIZE_PRESETS, ...SCENARIO_PRESETS];

const USAGE_KEYS = [
  "monthlyRequests",
  "inputTokensPerRequest",
  "outputTokensPerRequest",
] as const;

describe("preset data", () => {
  it("keeps every id unique across both groups", () => {
    const ids = ALL_PRESETS.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every preset a label, a description and usable numbers", () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.label.length, preset.id).toBeGreaterThan(0);
      expect(preset.description.length, preset.id).toBeGreaterThan(0);

      for (const key of USAGE_KEYS) {
        const value = preset[key];

        expect(Number.isSafeInteger(value), `${preset.id}.${key}`).toBe(true);
        expect(value, `${preset.id}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("offers a Custom scenario that starts from the default estimate", () => {
    expect(presetById(CUSTOM_SCENARIO_ID)).toMatchObject(DEFAULT_USAGE);
    expect(SCENARIO_PRESETS[0].id).toBe(CUSTOM_SCENARIO_ID);
  });

  it("holds the documented scenario values", () => {
    expect(usageOf(presetById("chatbot"))).toEqual({
      monthlyRequests: 200_000,
      inputTokensPerRequest: 800,
      outputTokensPerRequest: 400,
    });
    expect(usageOf(presetById("rag"))).toEqual({
      monthlyRequests: 50_000,
      inputTokensPerRequest: 6_000,
      outputTokensPerRequest: 600,
    });
    expect(usageOf(presetById("agent"))).toEqual({
      monthlyRequests: 20_000,
      inputTokensPerRequest: 12_000,
      outputTokensPerRequest: 1_500,
    });
  });
});

describe("selecting a preset populates the form", () => {
  it("fills all three fields with the preset's numbers", () => {
    for (const preset of ALL_PRESETS) {
      const draft = toUsageDraft(preset);

      expect(draft).toEqual({
        monthlyRequests: String(preset.monthlyRequests),
        inputTokensPerRequest: String(preset.inputTokensPerRequest),
        outputTokensPerRequest: String(preset.outputTokensPerRequest),
      });
      // What lands in the fields parses back to exactly the preset.
      expect(parseUsageDraft(draft)).toEqual(usageOf(preset));
    }
  });

  it("selects each scenario preset after loading it", () => {
    for (const preset of SCENARIO_PRESETS) {
      expect(resolveScenarioPresetId(usageOf(preset))).toBe(preset.id);
    }
  });

  it("selects each scale preset after loading it", () => {
    for (const preset of SIZE_PRESETS) {
      expect(matchSizePresetId(usageOf(preset))).toBe(preset.id);
    }
  });
});

describe("editing a preset's numbers moves the selection to Custom", () => {
  it("switches to Custom when the RAG input tokens are edited", () => {
    const rag = presetById("rag");

    expect(resolveScenarioPresetId(usageOf(rag))).toBe("rag");
    expect(
      resolveScenarioPresetId({ ...usageOf(rag), inputTokensPerRequest: 9_000 }),
    ).toBe(CUSTOM_SCENARIO_ID);
  });

  it("switches to Custom whichever field is edited", () => {
    const rag = usageOf(presetById("rag"));

    for (const key of USAGE_KEYS) {
      expect(resolveScenarioPresetId({ ...rag, [key]: rag[key] + 1 }), key).toBe(
        CUSTOM_SCENARIO_ID,
      );
      expect(resolveScenarioPresetId({ ...rag, [key]: rag[key] - 1 }), key).toBe(
        CUSTOM_SCENARIO_ID,
      );
    }
  });

  it("reports no scenario match once the numbers leave a preset", () => {
    const rag = usageOf(presetById("rag"));

    expect(matchScenarioPresetId(rag)).toBe("rag");
    expect(matchScenarioPresetId({ ...rag, outputTokensPerRequest: 601 })).toBeNull();
  });

  it("leaves the scale group unselected when the numbers match nothing", () => {
    expect(matchSizePresetId(usageOf(presetById("rag")))).toBeNull();
    expect(matchSizePresetId({ ...usageOf(presetById("small")), monthlyRequests: 1 })).toBeNull();
  });

  it("never selects a named preset whose numbers differ from the form", () => {
    for (const preset of ALL_PRESETS) {
      for (const key of USAGE_KEYS) {
        const edited: UsageInput = {
          ...usageOf(preset),
          [key]: preset[key] + 1,
        };
        const selected = resolveScenarioPresetId(edited);

        // Custom is the catch-all, so only a named selection has to match.
        if (selected === CUSTOM_SCENARIO_ID) continue;

        expect(usageOf(presetById(selected)), `${preset.id} -> ${selected}`).toEqual(
          edited,
        );
      }
    }
  });
});

describe("preset values feed the pricing calculations", () => {
  it("prices every preset against every model", () => {
    for (const preset of ALL_PRESETS) {
      const estimates = calculateAllModelEstimates(PRICING_DATASET, preset);

      expect(estimates).toHaveLength(PRICING_DATASET.length);

      for (const estimate of estimates) {
        expect(Number.isFinite(estimate.totalCost), preset.id).toBe(true);
        expect(estimate.totalCost, preset.id).toBeGreaterThan(0);
        expect(estimate.currency).toBe("USD");
      }

      const comparison = calculateCostComparison(estimates);

      expect(comparison.lowest, preset.id).not.toBeNull();
      expect(comparison.hasCostRange, preset.id).toBe(true);
      expect(comparison.savingsPercentage).toBeGreaterThanOrEqual(0);
      expect(comparison.savingsPercentage).toBeLessThanOrEqual(100);
    }
  });

  it("prices what the form holds, not just the preset object", () => {
    for (const preset of ALL_PRESETS) {
      const viaForm = parseUsageDraft(toUsageDraft(preset));

      expect(calculateAllModelEstimates(PRICING_DATASET, viaForm)).toEqual(
        calculateAllModelEstimates(PRICING_DATASET, preset),
      );
    }
  });

  // Claude Sonnet 5 publishes a flat $2 in / $10 out per 1M tokens, so the
  // monthly cost is (requests x tokens) / 1M x price with no tier in play.
  const FLAT_PRICING_CASES: [id: string, expectedMonthlyCost: number][] = [
    ["chatbot", 1_120],
    ["rag", 900],
    ["agent", 780],
  ];

  it.each(FLAT_PRICING_CASES)(
    "costs the %s preset at %i USD per month on Claude Sonnet 5",
    (id, expectedMonthlyCost) => {
      const estimate = calculateModelEstimate(
        findModel("anthropic-claude-sonnet-5"),
        presetById(id),
      );

      expect(estimate.tier.id).toBe("base");
      expect(estimate.totalCost).toBe(expectedMonthlyCost);
    },
  );
});

describe("presets do not disturb pricing tier behaviour", () => {
  it("keeps every preset on the base tier for every model", () => {
    for (const preset of ALL_PRESETS) {
      for (const model of PRICING_DATASET) {
        const tier = resolvePricingTier(model, preset.inputTokensPerRequest);

        expect(tier.id, `${preset.id} / ${model.id}`).toBe("base");
      }
    }
  });

  it("keeps RAG and AI Agent below every published long-context boundary", () => {
    for (const id of ["rag", "agent"]) {
      const preset = presetById(id);

      for (const model of PRICING_DATASET) {
        const threshold = getContextThreshold(model);
        if (threshold === null) continue;

        expect(
          preset.inputTokensPerRequest,
          `${id} / ${model.id}`,
        ).toBeLessThanOrEqual(threshold);
      }
    }
  });

  it("shows no long-context badge for any preset", () => {
    for (const preset of ALL_PRESETS) {
      const estimates = calculateAllModelEstimates(PRICING_DATASET, preset);

      expect(
        estimates.filter((estimate) => estimate.tier.id === "long-context"),
        preset.id,
      ).toEqual([]);
    }
  });
});

describe("preset selection and the URL agree", () => {
  it("keeps a scenario selected when the URL's numbers match it", () => {
    expect(resolveScenarioPresetId(parseCalculatorSearch("?scenario=rag"))).toBe(
      "rag",
    );
    expect(
      resolveScenarioPresetId(parseCalculatorSearch("?scenario=agent")),
    ).toBe("agent");
    expect(
      resolveScenarioPresetId(
        parseCalculatorSearch("?requests=50000&input=6000&output=600"),
      ),
    ).toBe("rag");
  });

  it("shows Custom when the URL's numbers no longer match its scenario", () => {
    for (const key of ["input", "requests", "output"]) {
      const search = `?scenario=rag&${key}=9000`;

      expect(
        resolveScenarioPresetId(parseCalculatorSearch(search)),
        search,
      ).toBe(CUSTOM_SCENARIO_ID);
    }
  });

  it("shows Custom after an edited link is re-shared", () => {
    const search = buildCalculatorSearch({
      ...usageOf(presetById("rag")),
      inputTokensPerRequest: 9_000,
    });

    expect(search).toBe("requests=50000&input=9000&output=600");
    expect(resolveScenarioPresetId(parseCalculatorSearch(search))).toBe(
      CUSTOM_SCENARIO_ID,
    );
  });

  it("leaves the default estimate out of the query string", () => {
    expect(buildCalculatorSearch(DEFAULT_USAGE)).toBe("");
    expect(resolveScenarioPresetId(parseCalculatorSearch(""))).toBe(
      CUSTOM_SCENARIO_ID,
    );
  });
});
