"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { UsageDraft } from "@/lib/types";
import { DEFAULT_USAGE } from "@/lib/presets";
import { PRICING_CHECKED_AT, PRICING_DATASET } from "@/lib/pricing";
import { formatCheckedAt } from "@/lib/format";
import {
  calculateAllModelEstimates,
  calculateCostComparison,
  parseUsageDraft,
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
  const comparison = useMemo(
    () => calculateCostComparison(calculateAllModelEstimates(PRICING_DATASET, usage)),
    [usage],
  );

  return (
    <section id="calculator" className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-600">
            Pricing verified from official provider documentation. Last review:{" "}
            {formatCheckedAt(PRICING_CHECKED_AT)}.
          </p>
        </div>

        <UsageCalculator draft={draft} onChange={setDraft} />
        <UsageSummary usage={usage} />
        <ModelComparison comparison={comparison} />
      </div>
    </section>
  );
}
