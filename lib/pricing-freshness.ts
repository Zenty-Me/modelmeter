import { PRICING_CHECKED_AT } from "./pricing";

/**
 * Age of a manual pricing review.
 *
 * `checkedAt` records the date a human last compared a price against the
 * provider's own documentation. This module measures how long ago that was and
 * nothing else: it makes no claim that a price has actually changed, and it
 * never reaches out to a provider to find out. Prices move only when someone
 * edits `lib/pricing.ts` by hand.
 */

export type PricingFreshnessStatus = "fresh" | "review" | "stale" | "unknown";

export interface PricingFreshness {
  status: PricingFreshnessStatus;
  /** Whole days since the review date. `0` when the date is unreadable. */
  daysSinceReview: number;
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 0–30 days is fresh, 31–60 asks for a review, 61+ may be out of date. */
const REVIEW_AFTER_DAYS = 30;
const STALE_AFTER_DAYS = 60;

const LABELS: Record<PricingFreshnessStatus, string> = {
  fresh: "Recently verified",
  review: "Review recommended",
  stale: "Pricing may be outdated",
  unknown: "Review date unavailable",
};

/**
 * A `YYYY-MM-DD` string as whole days since the epoch.
 *
 * Returns null for anything that is not exactly a date-only string with a real
 * calendar date, so callers can never end up comparing `NaN`.
 */
function parseCheckedAtDay(checkedAt: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(checkedAt.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  // Date.UTC rolls impossible dates over (2026-02-31 becomes 2026-03-03).
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp / DAY_MS;
}

/** The UTC calendar day an instant falls on, as whole days since the epoch. */
function utcDayOf(date: Date): number | null {
  if (Number.isNaN(date.getTime())) return null;

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS;
}

function statusForDays(days: number): PricingFreshnessStatus {
  if (days <= REVIEW_AFTER_DAYS) return "fresh";
  if (days <= STALE_AFTER_DAYS) return "review";

  return "stale";
}

/**
 * How long ago a manual pricing review was recorded.
 *
 * Both sides are compared as UTC calendar dates, because `checkedAt` carries no
 * time and no timezone — comparing UTC midnights is what stops the answer
 * shifting by a day depending on where the reader is sitting.
 *
 * `now` defaults to the real clock; it is never hardcoded. That is also why the
 * UI reads this after mounting instead of during a prerender: a build-time
 * answer would freeze the age at deploy time.
 *
 * An unreadable date returns `unknown` rather than a fabricated age, so nothing
 * downstream can render `NaN` days or claim freshness on no evidence. A review
 * dated in the future (bad data) counts as zero days old, because a negative
 * age is not a thing.
 */
export function getPricingFreshness(
  checkedAt: string,
  now: Date = new Date(),
): PricingFreshness {
  const reviewedDay = parseCheckedAtDay(checkedAt);
  const today = utcDayOf(now);

  if (reviewedDay === null || today === null) {
    return { status: "unknown", daysSinceReview: 0, label: LABELS.unknown };
  }

  const daysSinceReview = Math.max(0, today - reviewedDay);
  const status = statusForDays(daysSinceReview);

  return { status, daysSinceReview, label: LABELS[status] };
}

/** Freshness of the dataset-wide review date. */
export function getDatasetPricingFreshness(
  now: Date = new Date(),
): PricingFreshness {
  return getPricingFreshness(PRICING_CHECKED_AT, now);
}
