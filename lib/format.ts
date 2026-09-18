const COMPACT_THRESHOLD = 1_000_000;

const groupedFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

/**
 * Below one million the value is grouped (100,000); at or above one million
 * it is abbreviated (200M, 1.5B) so large token counts stay readable.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";

  const rounded = Math.round(value);
  const useCompact = Math.abs(rounded) >= COMPACT_THRESHOLD;

  return useCompact
    ? compactFormatter.format(rounded)
    : groupedFormatter.format(rounded);
}

export function formatTokens(value: number): string {
  return formatNumber(value);
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    // Sub-dollar estimates need extra precision to stay meaningful.
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

export function formatPricePerMillion(value: number): string {
  return `${formatCurrency(value)} / 1M tokens`;
}

export function formatMonthlyCost(value: number): string {
  return `${formatCurrency(value)} / month`;
}

/** Signed delta, used when comparing a model against the cheapest option. */
export function formatSignedCurrency(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "0%";

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  // `checkedAt` is a date-only string, so it must not be shifted by the
  // viewer's timezone.
  timeZone: "UTC",
});

/** Renders an ISO date (`2026-09-18`) as `Sep 18, 2026`. */
export function formatCheckedAt(checkedAt?: string): string {
  if (!checkedAt) return "Not verified yet";

  const date = new Date(`${checkedAt}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return checkedAt;

  return dateFormatter.format(date);
}
