import { describe, expect, it } from "vitest";

import {
  calculateAllModelEstimates,
  calculateCostComparison,
  toUsageDraft,
} from "../calculator";
import { DEFAULT_USAGE, SCENARIO_PRESETS, SIZE_PRESETS } from "../presets";
import { PRICING_DATASET } from "../pricing";
import type { UsageInput } from "../types";
import {
  CALCULATOR_PARAM_NAMES,
  buildCalculatorSearch,
  matchesCalculatorSearch,
  parseCalculatorSearch,
} from "../url-state";

/** Every parameter name present in a query string. */
function paramNames(search: string): string[] {
  return [...new URLSearchParams(search).keys()];
}

/** The usage a scenario preset stands for, or a loud failure. */
function presetUsage(id: string): UsageInput {
  const preset = SCENARIO_PRESETS.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Missing scenario preset: ${id}`);

  return preset.usage;
}

describe("reading calculator inputs from the URL", () => {
  it("falls back to the defaults on an empty URL", () => {
    expect(parseCalculatorSearch("")).toEqual(DEFAULT_USAGE);
    expect(parseCalculatorSearch("?")).toEqual(DEFAULT_USAGE);
  });

  it("reads the documented example URL", () => {
    expect(
      parseCalculatorSearch("?requests=100000&input=2000&output=500"),
    ).toEqual({ monthlyRequests: 100_000, inputTokensPerRequest: 2_000, outputTokensPerRequest: 500 });
  });

  it("accepts the search string with or without the leading question mark", () => {
    expect(parseCalculatorSearch("requests=1000&input=10&output=20")).toEqual(
      parseCalculatorSearch("?requests=1000&input=10&output=20"),
    );
  });

  it("hands the input fields exactly the values from the URL", () => {
    expect(
      toUsageDraft(
        parseCalculatorSearch("?requests=10000&input=300000&output=1000"),
      ),
    ).toEqual({
      monthlyRequests: "10000",
      inputTokensPerRequest: "300000",
      outputTokensPerRequest: "1000",
    });
  });

  it("resolves each field on its own when only some are given", () => {
    expect(parseCalculatorSearch("?input=5000")).toEqual({
      monthlyRequests: DEFAULT_USAGE.monthlyRequests,
      inputTokensPerRequest: 5_000,
      outputTokensPerRequest: DEFAULT_USAGE.outputTokensPerRequest,
    });
  });

  it("keeps an explicit zero instead of treating it as missing", () => {
    expect(parseCalculatorSearch("?requests=0&input=0&output=0")).toEqual({
      monthlyRequests: 0,
      inputTokensPerRequest: 0,
      outputTokensPerRequest: 0,
    });
  });

  it("ignores surrounding whitespace", () => {
    expect(parseCalculatorSearch("?requests=%201000%20").monthlyRequests).toBe(
      1_000,
    );
  });

  it("does not read parameters it does not own", () => {
    expect(
      parseCalculatorSearch("?utm_source=newsletter&requests=250"),
    ).toEqual({
      monthlyRequests: 250,
      inputTokensPerRequest: DEFAULT_USAGE.inputTokensPerRequest,
      outputTokensPerRequest: DEFAULT_USAGE.outputTokensPerRequest,
    });
  });
});

describe("unusable URL values fall back instead of reaching the calculator", () => {
  it("ignores a fully malformed URL", () => {
    expect(
      parseCalculatorSearch("?requests=abc&input=-1&output=Infinity"),
    ).toEqual(DEFAULT_USAGE);
  });

  it("rejects non-numeric, negative, infinite and empty values", () => {
    const rejected = [
      "abc",
      "12abc",
      "-1",
      "-1000000",
      "Infinity",
      "-Infinity",
      "NaN",
      "1e400",
      "",
      "   ",
    ];

    for (const raw of rejected) {
      const usage = parseCalculatorSearch(
        `?requests=${encodeURIComponent(raw)}&input=1&output=1`,
      );

      expect(usage.monthlyRequests, `requests=${raw}`).toBe(
        DEFAULT_USAGE.monthlyRequests,
      );
    }
  });

  it("normalises a value that is finite but out of range", () => {
    // The calculator's own ceiling, applied by the shared normaliser.
    expect(parseCalculatorSearch("?requests=1e21").monthlyRequests).toBe(1e12);
  });

  it("does not throw on a malformed percent-encoding", () => {
    expect(() => parseCalculatorSearch("?input=%zz&requests=1000")).not.toThrow();
    expect(parseCalculatorSearch("?input=%zz&requests=1000")).toEqual({
      monthlyRequests: 1_000,
      inputTokensPerRequest: DEFAULT_USAGE.inputTokensPerRequest,
      outputTokensPerRequest: DEFAULT_USAGE.outputTokensPerRequest,
    });
  });
});

describe("scenario presets in the URL", () => {
  it("expands a known scenario id", () => {
    expect(parseCalculatorSearch("?scenario=rag")).toEqual(presetUsage("rag"));
  });

  it("expands a scale preset id too, so every shareable link round-trips", () => {
    for (const preset of [...SIZE_PRESETS, ...SCENARIO_PRESETS]) {
      expect(parseCalculatorSearch(`?scenario=${preset.id}`)).toEqual(
        preset.usage,
      );
    }
  });

  it("falls back to the defaults for an unknown or empty id", () => {
    expect(parseCalculatorSearch("?scenario=nope")).toEqual(DEFAULT_USAGE);
    expect(parseCalculatorSearch("?scenario=")).toEqual(DEFAULT_USAGE);
  });

  it("lets an explicit number override the preset it accompanies", () => {
    expect(parseCalculatorSearch("?scenario=rag&input=100")).toEqual({
      monthlyRequests: presetUsage("rag").monthlyRequests,
      inputTokensPerRequest: 100,
      outputTokensPerRequest: presetUsage("rag").outputTokensPerRequest,
    });
  });
});

describe("writing calculator inputs to the URL", () => {
  it("writes no parameters at all for the default estimate", () => {
    expect(buildCalculatorSearch(DEFAULT_USAGE)).toBe("");
  });

  it("writes the inputs in a readable, stable order", () => {
    expect(
      buildCalculatorSearch({
        monthlyRequests: 10_000,
        inputTokensPerRequest: 300_000,
        outputTokensPerRequest: 1_000,
      }),
    ).toBe("requests=10000&input=300000&output=1000");
  });

  it("writes a scenario preset as its id rather than as three numbers", () => {
    expect(buildCalculatorSearch(presetUsage("rag"))).toBe("scenario=rag");
  });

  it("writes scale presets out in full, so `scenario` keeps its meaning", () => {
    for (const preset of SIZE_PRESETS) {
      const search = buildCalculatorSearch(preset.usage);

      if (search === "") continue; // medium is the default estimate

      expect(paramNames(search)).toEqual(["requests", "input", "output"]);
    }
  });

  it("only ever stores public calculator inputs", () => {
    const searches = [
      buildCalculatorSearch(DEFAULT_USAGE),
      ...SIZE_PRESETS.map((preset) => buildCalculatorSearch(preset.usage)),
      ...SCENARIO_PRESETS.map((preset) => buildCalculatorSearch(preset.usage)),
      buildCalculatorSearch({
        monthlyRequests: 7,
        inputTokensPerRequest: 11,
        outputTokensPerRequest: 13,
      }),
    ];

    for (const search of searches) {
      for (const name of paramNames(search)) {
        expect(CALCULATOR_PARAM_NAMES).toContain(name);
      }
    }
  });

  it("round-trips every preset", () => {
    for (const preset of [...SIZE_PRESETS, ...SCENARIO_PRESETS]) {
      expect(parseCalculatorSearch(buildCalculatorSearch(preset.usage))).toEqual(
        preset.usage,
      );
    }
  });

  it("round-trips an arbitrary usage", () => {
    const usage: UsageInput = {
      monthlyRequests: 12_345,
      inputTokensPerRequest: 678,
      outputTokensPerRequest: 9_101,
    };

    expect(parseCalculatorSearch(buildCalculatorSearch(usage))).toEqual(usage);
  });
});

describe("deciding whether the URL needs rewriting", () => {
  it("treats an absent and an empty query string as the same thing", () => {
    expect(matchesCalculatorSearch("", "")).toBe(true);
    expect(matchesCalculatorSearch("", "?utm_source=newsletter")).toBe(true);
  });

  it("ignores the leading question mark and parameter order", () => {
    expect(
      matchesCalculatorSearch(
        "requests=1&input=2&output=3",
        "?output=3&requests=1&input=2",
      ),
    ).toBe(true);
  });

  it("detects a real difference", () => {
    expect(matchesCalculatorSearch("scenario=rag", "?scenario=chatbot")).toBe(
      false,
    );
    expect(
      matchesCalculatorSearch("requests=10000", "?requests=10000&input=1"),
    ).toBe(false);
    expect(matchesCalculatorSearch("", "?requests=abc")).toBe(false);
  });
});

describe("URL regression: 300K-token requests via a shared link", () => {
  const usage = parseCalculatorSearch(
    "?requests=10000&input=300000&output=1000",
  );
  const estimates = calculateAllModelEstimates(PRICING_DATASET, usage);
  const comparison = calculateCostComparison(estimates);

  it("loads the usage from the URL", () => {
    expect(usage).toEqual({
      monthlyRequests: 10_000,
      inputTokensPerRequest: 300_000,
      outputTokensPerRequest: 1_000,
    });
  });

  it("applies GPT-5.6 Luna's long-context pricing", () => {
    const luna = estimates.find(
      (estimate) => estimate.model.id === "openai-gpt-5-6-luna",
    );

    expect(luna?.tier.id).toBe("long-context");
    expect(luna?.totalCost).toBe(1_218);
  });

  it("still makes Gemini 3.1 Flash-Lite the lowest estimated cost", () => {
    expect(comparison.lowest?.model.id).toBe("google-gemini-3-1-flash-lite");
    expect(comparison.lowest?.totalCost).toBe(765);
  });

  it("is the URL the app writes back for the same usage", () => {
    expect(buildCalculatorSearch(usage)).toBe(
      "requests=10000&input=300000&output=1000",
    );
  });
});
