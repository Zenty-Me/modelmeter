import type { CostComparison } from "@/lib/types";
import { ModelCard } from "./ModelCard";
import { ComparisonSummary } from "./ComparisonSummary";

export function ModelComparison({
  comparison,
}: {
  comparison: CostComparison;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Estimated Monthly Cost
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Based on your usage and the verified pricing dataset.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Sorted by estimated monthly cost, lowest first.
        </p>
      </div>

      <ComparisonSummary comparison={comparison} />

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparison.entries.map((entry) => (
          <li key={entry.estimate.model.id} className="h-full">
            <ModelCard entry={entry} hasCostRange={comparison.hasCostRange} />
          </li>
        ))}
      </ul>
    </section>
  );
}
