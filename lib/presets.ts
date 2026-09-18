import type { UsageInput, UsagePreset } from "./types";

export const DEFAULT_USAGE: UsageInput = {
  monthlyRequests: 100_000,
  inputTokensPerRequest: 2_000,
  outputTokensPerRequest: 500,
};

/**
 * UX presets only.
 *
 * These numbers are NOT industry benchmarks and are not derived from any real
 * traffic data. They exist purely so the calculator can be filled with one
 * click while the form is being explored.
 */
export const SIZE_PRESETS: UsagePreset[] = [
  {
    id: "small",
    label: "Small",
    hint: "10K requests / month",
    usage: {
      monthlyRequests: 10_000,
      inputTokensPerRequest: 1_000,
      outputTokensPerRequest: 300,
    },
  },
  {
    id: "medium",
    label: "Medium",
    hint: "100K requests / month",
    usage: DEFAULT_USAGE,
  },
  {
    id: "large",
    label: "Large",
    hint: "1M requests / month",
    usage: {
      monthlyRequests: 1_000_000,
      inputTokensPerRequest: 4_000,
      outputTokensPerRequest: 800,
    },
  },
];

export const SCENARIO_PRESETS: UsagePreset[] = [
  {
    id: "custom",
    label: "Custom",
    hint: "Start from the defaults",
    usage: DEFAULT_USAGE,
  },
  {
    id: "chatbot",
    label: "Chatbot",
    hint: "Short prompts, short replies",
    usage: {
      monthlyRequests: 200_000,
      inputTokensPerRequest: 800,
      outputTokensPerRequest: 400,
    },
  },
  {
    id: "rag",
    label: "RAG",
    hint: "Retrieved context dominates input",
    usage: {
      monthlyRequests: 50_000,
      inputTokensPerRequest: 6_000,
      outputTokensPerRequest: 600,
    },
  },
  {
    id: "agent",
    label: "AI Agent",
    hint: "Multi-step, tool-heavy calls",
    usage: {
      monthlyRequests: 20_000,
      inputTokensPerRequest: 12_000,
      outputTokensPerRequest: 1_500,
    },
  },
];

/** Every preset, in the order the UI presents them. */
const ALL_PRESETS: readonly UsagePreset[] = [
  ...SIZE_PRESETS,
  ...SCENARIO_PRESETS,
];

function usageMatchesPreset(preset: UsagePreset, usage: UsageInput): boolean {
  return (Object.keys(preset.usage) as (keyof UsageInput)[]).every(
    (key) => preset.usage[key] === usage[key],
  );
}

function matchPreset(
  presets: readonly UsagePreset[],
  usage: UsageInput,
): string | null {
  return presets.find((preset) => usageMatchesPreset(preset, usage))?.id ?? null;
}

/** The preset a usage set matches, across both groups. */
export function matchPresetId(usage: UsageInput): string | null {
  return matchPreset(ALL_PRESETS, usage);
}

/**
 * The scenario preset a usage set matches, or null.
 *
 * Deliberately only the scenario group: a scenario preset is written to the URL
 * as `scenario=<id>` because the id is shorter than the three numbers it
 * expands to, while the scale presets write their numbers out in full so the
 * parameter name keeps meaning what it says.
 */
export function matchScenarioPresetId(usage: UsageInput): string | null {
  return matchPreset(SCENARIO_PRESETS, usage);
}

/** Looks up any preset by id, so a shared `scenario=<id>` can be read back. */
export function findPresetById(id: string | null): UsagePreset | null {
  if (!id) return null;

  return ALL_PRESETS.find((preset) => preset.id === id) ?? null;
}
