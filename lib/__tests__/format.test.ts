import { describe, expect, it } from "vitest";

import {
  formatCheckedAt,
  formatCompactTokens,
  formatCurrency,
  formatMonthlyCost,
  formatNumber,
  formatPercentage,
  formatPricePerMillion,
  formatSignedCurrency,
  formatTokens,
} from "../format";

describe("formatNumber", () => {
  it("groups values below one million", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1_000)).toBe("1,000");
    expect(formatNumber(100_000)).toBe("100,000");
    expect(formatNumber(272_000)).toBe("272,000");
    expect(formatNumber(999_999)).toBe("999,999");
  });

  it("abbreviates values at or above one million", () => {
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(200_000_000)).toBe("200M");
    expect(formatNumber(1_500_000_000)).toBe("1.5B");
  });

  it("rounds to the nearest whole number before formatting", () => {
    expect(formatNumber(1_000.4)).toBe("1,000");
    expect(formatNumber(2_500_000)).toBe("2.5M");
  });

  it("falls back to zero for values that are not usable numbers", () => {
    expect(formatNumber(Number.NaN)).toBe("0");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("0");
  });

  it("is the same formatter as formatTokens", () => {
    expect(formatTokens(250_000_000)).toBe("250M");
    expect(formatTokens(250_000_000)).toBe(formatNumber(250_000_000));
  });
});

describe("formatCompactTokens", () => {
  it("always abbreviates thousands and above", () => {
    expect(formatCompactTokens(1_000)).toBe("1K");
    expect(formatCompactTokens(2_000)).toBe("2K");
    expect(formatCompactTokens(200_000)).toBe("200K");
    expect(formatCompactTokens(272_000)).toBe("272K");
    expect(formatCompactTokens(1_000_000)).toBe("1M");
  });

  it("keeps small counts exact", () => {
    expect(formatCompactTokens(500)).toBe("500");
  });

  it("falls back to zero for values that are not usable numbers", () => {
    expect(formatCompactTokens(Number.NaN)).toBe("0");
    expect(formatCompactTokens(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("formatCurrency", () => {
  it("formats whole dollars and cents", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(0.2)).toBe("$0.20");
    expect(formatCurrency(12.5)).toBe("$12.50");
    expect(formatCurrency(900)).toBe("$900.00");
    expect(formatCurrency(1218)).toBe("$1,218.00");
  });

  it("rounds to two decimals at or above one dollar", () => {
    expect(formatCurrency(12.3456)).toBe("$12.35");
  });

  it("keeps up to four decimals below one dollar so small estimates stay meaningful", () => {
    expect(formatCurrency(0.0625)).toBe("$0.0625");
    expect(formatCurrency(0.0025)).toBe("$0.0025");
  });

  it("falls back to zero for values that are not usable numbers", () => {
    expect(formatCurrency(Number.NaN)).toBe("$0.00");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("$0.00");
  });
});

describe("composed formatters", () => {
  it("appends the unit to a price per million tokens", () => {
    expect(formatPricePerMillion(2)).toBe("$2.00 / 1M tokens");
    expect(formatPricePerMillion(0.2)).toBe("$0.20 / 1M tokens");
  });

  it("appends the period to a monthly cost", () => {
    expect(formatMonthlyCost(900)).toBe("$900.00 / month");
  });

  it("always signs a comparison delta", () => {
    expect(formatSignedCurrency(4)).toBe("+$4.00");
    expect(formatSignedCurrency(-4)).toBe("-$4.00");
    expect(formatSignedCurrency(0)).toBe("+$0.00");
  });
});

describe("formatPercentage", () => {
  it("rounds to one decimal place", () => {
    expect(formatPercentage(75)).toBe("75%");
    expect(formatPercentage(0)).toBe("0%");
    expect(formatPercentage(100)).toBe("100%");
    expect(formatPercentage(95.555_555_555_555_56)).toBe("95.6%");
  });

  it("leaves values above 100% on the wire — it only formats", () => {
    expect(formatPercentage(200)).toBe("200%");
  });

  it("falls back to zero for values that are not usable numbers", () => {
    expect(formatPercentage(Number.NaN)).toBe("0%");
    expect(formatPercentage(Number.POSITIVE_INFINITY)).toBe("0%");
  });
});

describe("formatCheckedAt", () => {
  it("renders an ISO date without shifting timezone", () => {
    expect(formatCheckedAt("2026-09-18")).toBe("Sep 18, 2026");
  });

  it("returns the raw value when it is not a date", () => {
    expect(formatCheckedAt("not-a-date")).toBe("not-a-date");
  });
});
