"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import type { UsageDraft } from "@/lib/types";
import { DEFAULT_USAGE } from "@/lib/presets";
import { DEMO_PRICING_DATASET } from "@/lib/pricing";
import {
  calculateAllModelEstimates,
  parseUsageDraft,
  sortEstimatesByCost,
  toUsageDraft,
} from "@/lib/calculator";
import { UsageCalculator } from "./UsageCalculator";
import { UsageSummary } from "./UsageSummary";
import { ModelComparison } from "./ModelComparison";

export function CostEstimator() {
  const [draft, setDraft] = useState<UsageDraft>(() =>
    toUsageDraft(DEFAULT_USAGE),
  );

  const usage = useMemo(() => parseUsageDraft(draft), [draft]);
  const estimates = useMemo(
    () =>
      sortEstimatesByCost(
        calculateAllModelEstimates(DEMO_PRICING_DATASET, usage),
      ),
    [usage],
  );

  return (
    <section id="calculator" className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <CircleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">
              Demo pricing data — official pricing will be added before
              production.
            </p>
            <p className="mt-1 text-amber-800">
              Every model below uses placeholder prices. Results are for
              interface demonstration only and must not be treated as real API
              costs.
            </p>
          </div>
        </div>

        <UsageCalculator draft={draft} onChange={setDraft} />
        <UsageSummary usage={usage} />
        <ModelComparison estimates={estimates} />
      </div>
    </section>
  );
}
