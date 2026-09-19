"use client";

import { useSyncExternalStore } from "react";
import type { PricingFreshnessStatus } from "@/lib/pricing-freshness";
import { getDatasetPricingFreshness } from "@/lib/pricing-freshness";

/**
 * Quiet by default, a little louder once the review is overdue, and never
 * alarming: an old date is not an invalid dataset.
 */
const CHIP_CLASS: Record<PricingFreshnessStatus, string> = {
  fresh: "border-slate-200 bg-slate-50 text-slate-700",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  stale: "border-amber-400 bg-amber-100 text-amber-900",
  unknown: "border-slate-300 bg-slate-100 text-slate-700",
};

/**
 * The browser clock, read once and cached.
 *
 * The snapshot has to be referentially stable or React re-renders forever, and
 * a single reading is all this needs: the note describes the age of the dataset
 * when the reader opened the page.
 */
let clientClock: Date | null = null;

function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): Date | null {
  clientClock ??= new Date();

  return clientClock;
}

function getServerSnapshot(): Date | null {
  return null;
}

/**
 * How old the dataset's manual pricing review is.
 *
 * The age is read from the browser clock, never during server rendering. The
 * page is prerendered, so an answer computed on the server would be frozen at
 * build time and would still claim "recently verified" months after the review
 * date went stale. `useSyncExternalStore` is what makes that safe: its server
 * snapshot is null, so the prerendered HTML carries no claim at all and React
 * re-renders with the real date once it is hydrating in a browser.
 */
export function PricingFreshnessNote() {
  const now = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (now === null) return null;

  const freshness = getDatasetPricingFreshness(now);

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${CHIP_CLASS[freshness.status]}`}
      >
        {freshness.label}
      </span>
      {freshness.status === "stale" ? (
        <span className="text-slate-600">
          Verify the official sources above before relying on these estimates.
        </span>
      ) : null}
    </p>
  );
}
