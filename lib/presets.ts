import type { UsageInput, UsagePreset } from "./types";

export const DEFAULT_USAGE: UsageInput = {
  monthlyRequests: 100_000,
  inputTokensPerRequest: 2_000,
  outputTokensPerRequest: 500,
};

/**
 * Preset workloads, so the calculator can be filled in with one click.
 *
 * These numbers are hand-picked illustrative examples. They are NOT industry
 * averages, benchmarks, recommended production values or claims about typical
 * usage, and they are not derived from any real traffic data. The disclaimer
 * rendered next to the chips in `components/UsageCalculator.tsx` says so on
 * screen; do not remove it, and do not describe these values as
 * representative.
 */
export const SIZE_PRESETS: UsagePreset[] = [
  {
    id: "small",
    label: "Small",
    description: "10K requests per month, short prompts.",
    monthlyRequests: 10_000,
    inputTokensPerRequest: 1_000,
    outputTokensPerRequest: 300,
  },
  {
    id: "medium",
    label: "Medium",
    description: "100K requests per month, moderate prompts.",
    monthlyRequests: DEFAULT_USAGE.monthlyRequests,
    inputTokensPerRequest: DEFAULT_USAGE.inputTokensPerRequest,
    outputTokensPerRequest: DEFAULT_USAGE.outputTokensPerRequest,
  },
  {
    id: "large",
    label: "Large",
    description: "1M requests per month, longer prompts.",
    monthlyRequests: 1_000_000,
    inputTokensPerRequest: 4_000,
    outputTokensPerRequest: 800,
  },
];

/** The scenario shown when the inputs match no named workload — see below. */
export const CUSTOM_SCENARIO_ID = "custom";

export const SCENARIO_PRESETS: UsagePreset[] = [
  {
    id: CUSTOM_SCENARIO_ID,
    label: "Custom",
    description: "Start from the default estimate.",
    monthlyRequests: DEFAULT_USAGE.monthlyRequests,
    inputTokensPerRequest: DEFAULT_USAGE.inputTokensPerRequest,
    outputTokensPerRequest: DEFAULT_USAGE.outputTokensPerRequest,
  },
  {
    id: "chatbot",
    label: "Chatbot",
    description: "Illustrative short-prompt chat workload.",
    monthlyRequests: 200_000,
    inputTokensPerRequest: 800,
    outputTokensPerRequest: 400,
  },
  {
    id: "rag",
    label: "RAG",
    description: "Illustrative retrieval-augmented workload.",
    monthlyRequests: 50_000,
    inputTokensPerRequest: 6_000,
    outputTokensPerRequest: 600,
  },
  {
    id: "agent",
    label: "AI Agent",
    description: "Illustrative multi-step agent workload.",
    monthlyRequests: 20_000,
    inputTokensPerRequest: 12_000,
    outputTokensPerRequest: 1_500,
  },
];

/** Every preset, in the order the UI presents them. */
const ALL_PRESETS: readonly UsagePreset[] = [
  ...SIZE_PRESETS,
  ...SCENARIO_PRESETS,
];

/** The fields a preset and a usage have in common. */
const USAGE_KEYS = [
  "monthlyRequests",
  "inputTokensPerRequest",
  "outputTokensPerRequest",
] as const satisfies readonly (keyof UsageInput)[];

function usageMatchesPreset(preset: UsagePreset, usage: UsageInput): boolean {
  return USAGE_KEYS.every((key) => preset[key] === usage[key]);
}

function matchPreset(
  presets: readonly UsagePreset[],
  usage: UsageInput,
): string | null {
  return presets.find((preset) => usageMatchesPreset(preset, usage))?.id ?? null;
}

/** The scale preset a usage set matches, or null. */
export function matchSizePresetId(usage: UsageInput): string | null {
  return matchPreset(SIZE_PRESETS, usage);
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

/**
 * The scenario chip to show as selected for a usage set.
 *
 * Selection is always derived from the numbers, never stored, which is what
 * stops the highlighted chip from contradicting the form: the moment a preset's
 * values are edited the match disappears and this falls back to `custom`.
 */
export function resolveScenarioPresetId(usage: UsageInput): string {
  return matchScenarioPresetId(usage) ?? CUSTOM_SCENARIO_ID;
}

/** Looks up any preset by id, so a shared `scenario=<id>` can be read back. */
export function findPresetById(id: string | null): UsagePreset | null {
  if (!id) return null;

  return ALL_PRESETS.find((preset) => preset.id === id) ?? null;
}
