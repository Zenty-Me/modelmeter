import type { CostEstimate } from "@/lib/types";
import { ModelCard } from "./ModelCard";

export function ModelComparison({ estimates }: { estimates: CostEstimate[] }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Estimated Monthly Cost
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Based on your usage and current pricing dataset.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Sorted by estimated monthly cost, lowest first.
        </p>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {estimates.map((estimate) => (
          <li key={estimate.model.id} className="h-full">
            <ModelCard estimate={estimate} />
          </li>
        ))}
      </ul>
    </section>
  );
}
