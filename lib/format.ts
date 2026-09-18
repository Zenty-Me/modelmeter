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

/** Falls back to a placeholder when a date has not been recorded yet. */
export function formatCheckedAt(checkedAt?: string): string {
  return checkedAt ?? "Not verified yet";
}
