import { parseUsageValue } from "./calculator";
import { DEFAULT_USAGE, findPresetById, matchScenarioPresetId } from "./presets";
import type { UsageInput } from "./types";

/**
 * The calculator inputs as URL query parameters.
 *
 * Only public calculator inputs are stored. Derived values — resolved pricing
 * tiers, estimated costs, provider comparisons — are never encoded, because
 * they can all be recalculated from these four inputs.
 */
export const CALCULATOR_PARAM_NAMES = [
  "requests",
  "input",
  "output",
  "scenario",
] as const;

type CalculatorParamName = (typeof CALCULATOR_PARAM_NAMES)[number];

/**
 * Reads one numeric parameter.
 *
 * Returns `null` for anything unusable — absent, empty, non-numeric, negative
 * or infinite — so the caller can fall back. A usable value is passed through
 * the same normaliser the form uses, so a shared link and a typed-in value can
 * never disagree about what a number means.
 */
function readNumber(
  params: URLSearchParams,
  name: CalculatorParamName,
): number | null {
  const raw = params.get(name);
  if (raw === null) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parseUsageValue(trimmed);
}

/**
 * Turns a query string into calculator inputs.
 *
 * Every field resolves on its own, in this order: a usable numeric parameter,
 * then the matching value from a named scenario preset, then the default. A
 * malformed URL therefore degrades field by field instead of resetting the
 * whole estimate, and never throws.
 */
export function parseCalculatorSearch(search: string): UsageInput {
  const params = new URLSearchParams(search);
  const fallback = findPresetById(params.get("scenario"))?.usage ?? DEFAULT_USAGE;

  return {
    monthlyRequests:
      readNumber(params, "requests") ?? fallback.monthlyRequests,
    inputTokensPerRequest:
      readNumber(params, "input") ?? fallback.inputTokensPerRequest,
    outputTokensPerRequest:
      readNumber(params, "output") ?? fallback.outputTokensPerRequest,
  };
}

function isDefaultUsage(usage: UsageInput): boolean {
  return (
    usage.monthlyRequests === DEFAULT_USAGE.monthlyRequests &&
    usage.inputTokensPerRequest === DEFAULT_USAGE.inputTokensPerRequest &&
    usage.outputTokensPerRequest === DEFAULT_USAGE.outputTokensPerRequest
  );
}

/**
 * Encodes calculator inputs as a query string, without the leading `?`.
 *
 * Unnecessary parameters are left out: the default estimate is the bare URL,
 * and a scenario preset is written as its id rather than as the three numbers
 * it expands to, which keeps the link short and readable.
 */
export function buildCalculatorSearch(usage: UsageInput): string {
  if (isDefaultUsage(usage)) return "";

  const scenarioId = matchScenarioPresetId(usage);
  if (scenarioId !== null) {
    return new URLSearchParams({ scenario: scenarioId }).toString();
  }

  return new URLSearchParams({
    requests: String(usage.monthlyRequests),
    input: String(usage.inputTokensPerRequest),
    output: String(usage.outputTokensPerRequest),
  }).toString();
}

/**
 * True when the URL already says what the calculator is about to write.
 *
 * Compared on the parameters this feature owns rather than on the raw string,
 * so the writer does not navigate when nothing has changed and leaves
 * unrelated parameters (a `utm_*` tag, say) alone.
 */
export function matchesCalculatorSearch(
  search: string,
  currentSearch: string,
): boolean {
  const next = new URLSearchParams(search);
  const current = new URLSearchParams(currentSearch);

  return CALCULATOR_PARAM_NAMES.every(
    (name) => next.get(name) === current.get(name),
  );
}
