import { describe, expect, it } from "vitest";

import { PRICING_CHECKED_AT, PRICING_SOURCES } from "../pricing";
import {
  getDatasetPricingFreshness,
  getPricingFreshness,
} from "../pricing-freshness";
import type { PricingFreshnessStatus } from "../pricing-freshness";

const CHECKED_AT = "2026-09-01";

/**
 * Noon UTC keeps the day unambiguous: every instant below sits well inside its
 * UTC calendar day, so the assertions are about the rules and not about the
 * boundary of a day.
 */
function daysAfter(checkedAt: string, days: number): Date {
  return new Date(new Date(`${checkedAt}T12:00:00Z`).getTime() + days * 86_400_000);
}

/** The UTC calendar date an instant falls on, as `YYYY-MM-DD`. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const STATUSES: PricingFreshnessStatus[] = ["fresh", "review", "stale", "unknown"];

describe("freshness boundaries", () => {
  const cases: [days: number, status: PricingFreshnessStatus][] = [
    [0, "fresh"],
    [1, "fresh"],
    [30, "fresh"],
    [31, "review"],
    [59, "review"],
    [60, "review"],
    [61, "stale"],
    [365, "stale"],
  ];

  it.each(cases)("%i days after the review is %s", (days, status) => {
    const freshness = getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, days));

    expect(freshness.status).toBe(status);
    expect(freshness.daysSinceReview).toBe(days);
  });

  it("counts the day of the review itself as fresh", () => {
    const freshness = getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, 0));

    expect(freshness.daysSinceReview).toBe(0);
    expect(freshness.status).toBe("fresh");
    expect(freshness.label).toBe("Recently verified");
  });

  it("labels each status for display", () => {
    expect(getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, 0)).label).toBe(
      "Recently verified",
    );
    expect(getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, 31)).label).toBe(
      "Review recommended",
    );
    expect(getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, 61)).label).toBe(
      "Pricing may be outdated",
    );
  });

  it("ignores the time of day", () => {
    for (const time of ["00:00:01", "12:00:00", "23:59:59"]) {
      const freshness = getPricingFreshness(CHECKED_AT, new Date(`2026-10-01T${time}Z`));

      expect(freshness.daysSinceReview, time).toBe(30);
      expect(freshness.status, time).toBe("fresh");
    }
  });

  it("works on calendar days, not elapsed hours", () => {
    // A day and 23 hours after the review is the *next* calendar day, so it
    // counts as 31 days — the comparison is between dates, not timestamps.
    const almostThirtyOne = new Date(
      daysAfter(CHECKED_AT, 30).getTime() + 86_400_000 - 1,
    );

    expect(getPricingFreshness(CHECKED_AT, almostThirtyOne).daysSinceReview).toBe(31);
    expect(getPricingFreshness(CHECKED_AT, almostThirtyOne).status).toBe("review");
  });
});

describe("dates that are not in the past", () => {
  it("treats a review dated in the future as zero days old", () => {
    const freshness = getPricingFreshness("2026-10-01", new Date("2026-09-01T12:00:00Z"));

    expect(freshness.daysSinceReview).toBe(0);
    expect(freshness.status).toBe("fresh");
  });

  it("treats a review dated tomorrow as zero days old", () => {
    const freshness = getPricingFreshness(
      "2026-10-02",
      new Date("2026-10-01T12:00:00Z"),
    );

    expect(freshness.daysSinceReview).toBe(0);
    expect(freshness.status).toBe("fresh");
  });
});

describe("unreadable dates", () => {
  const invalidDates = [
    "",
    "   ",
    "not-a-date",
    "2026-9-1",
    "2026/09/01",
    "01-09-2026",
    "2026-09-01T00:00:00Z",
    "2026-13-01",
    "2026-00-10",
    "2026-02-31",
    "2026-09-31",
    "abc-09-01",
    "2026-09-0a",
  ];

  it.each(invalidDates)("handles %j without inventing an age", (checkedAt) => {
    const freshness = getPricingFreshness(checkedAt, new Date("2026-10-01T12:00:00Z"));

    expect(freshness.status).toBe("unknown");
    expect(freshness.daysSinceReview).toBe(0);
    expect(Number.isNaN(freshness.daysSinceReview)).toBe(false);
    expect(freshness.label).toBe("Review date unavailable");
  });

  it("does not treat a rolled-over date as valid", () => {
    // 2026-02-31 would silently become 2026-03-03 if the parse were naive.
    expect(getPricingFreshness("2026-02-31", new Date("2026-03-05T12:00:00Z")).status).toBe(
      "unknown",
    );
    expect(getPricingFreshness("2026-02-28", new Date("2026-03-05T12:00:00Z")).daysSinceReview).toBe(
      5,
    );
  });

  it("falls back to unknown when the clock itself is unusable", () => {
    expect(getPricingFreshness(CHECKED_AT, new Date("nope")).status).toBe("unknown");
    expect(getPricingFreshness(CHECKED_AT, new Date(Number.NaN)).status).toBe("unknown");
  });

  it("tolerates surrounding whitespace on a valid date", () => {
    expect(getPricingFreshness("  2026-09-01 ", daysAfter(CHECKED_AT, 31))).toEqual(
      getPricingFreshness(CHECKED_AT, daysAfter(CHECKED_AT, 31)),
    );
  });
});

describe("the result is always renderable", () => {
  const inputs = [
    "2026-09-01",
    "1999-01-01",
    "2100-01-01",
    "2026-10-01",
    "",
    "nonsense",
    "2026-02-31",
  ];

  it("never returns NaN, a negative age or an unknown status", () => {
    for (const checkedAt of inputs) {
      for (const offset of [-10, 0, 30, 31, 60, 61, 1_000]) {
        const freshness = getPricingFreshness(checkedAt, daysAfter("2026-09-01", offset));

        expect(Number.isInteger(freshness.daysSinceReview), checkedAt).toBe(true);
        expect(freshness.daysSinceReview, checkedAt).toBeGreaterThanOrEqual(0);
        expect(STATUSES, checkedAt).toContain(freshness.status);
        expect(freshness.label.length, checkedAt).toBeGreaterThan(0);
      }
    }
  });
});

describe("the dataset's own review date", () => {
  it("is fresh on the day it was reviewed", () => {
    const freshness = getDatasetPricingFreshness(
      new Date(`${PRICING_CHECKED_AT}T12:00:00Z`),
    );

    expect(freshness.daysSinceReview).toBe(0);
    expect(freshness.status).toBe("fresh");
  });

  it("asks for a review once it is a month old", () => {
    const freshness = getDatasetPricingFreshness(daysAfter(PRICING_CHECKED_AT, 31));

    expect(freshness.status).toBe("review");
    expect(freshness.daysSinceReview).toBe(31);
  });

  it("may be outdated once it is two months old", () => {
    expect(getDatasetPricingFreshness(daysAfter(PRICING_CHECKED_AT, 61)).status).toBe(
      "stale",
    );
  });

  it("reports a real age for today's clock", () => {
    const freshness = getDatasetPricingFreshness();

    expect(freshness.status).not.toBe("unknown");
    expect(Number.isInteger(freshness.daysSinceReview)).toBe(true);
    expect(freshness.daysSinceReview).toBeGreaterThanOrEqual(0);
  });
});

describe("per-provider freshness stays available", () => {
  it("resolves every provider's own review date", () => {
    const now = new Date(`${PRICING_CHECKED_AT}T12:00:00Z`);

    for (const source of PRICING_SOURCES) {
      const freshness = getPricingFreshness(source.checkedAt, now);

      expect(freshness.status, source.provider).not.toBe("unknown");
      expect(freshness.daysSinceReview, source.provider).toBe(0);
    }
  });

  it("reports diverging provider dates independently", () => {
    const now = daysAfter(PRICING_CHECKED_AT, 61);
    const reviewedDaysAgo = (days: number) =>
      isoDay(daysAfter(PRICING_CHECKED_AT, 61 - days));

    // The UI shows one global status today, but the rule is per date, so
    // provider dates can drift apart later without changing this module.
    const stale = getPricingFreshness(reviewedDaysAgo(61), now);
    const review = getPricingFreshness(reviewedDaysAgo(45), now);
    const fresh = getPricingFreshness(reviewedDaysAgo(7), now);

    expect([stale.status, review.status, fresh.status]).toEqual([
      "stale",
      "review",
      "fresh",
    ]);
    expect([stale.daysSinceReview, review.daysSinceReview, fresh.daysSinceReview]).toEqual([
      61, 45, 7,
    ]);
  });
});
