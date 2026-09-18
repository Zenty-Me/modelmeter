import type { CostComparison } from "@/lib/types";
import { formatCurrency, formatMonthlyCost, formatPercentage } from "@/lib/format";

/**
 * Compact answer-first summary: the reader should reach a conclusion before
 * scrolling through the individual model cards.
 */
export function ComparisonSummary({
  comparison,
}: {
  comparison: CostComparison;
}) {
  const { lowest, highest, potentialDifference, potentialPercentageDifference } =
    comparison;

  if (!lowest || !highest) return null;

  const stats = [
    { label: "Lowest", value: formatMonthlyCost(lowest.totalCost) },
    { label: "Highest", value: formatMonthlyCost(highest.totalCost) },
    {
      label: "Potential cost difference",
      value: formatMonthlyCost(potentialDifference),
    },
  ];

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-sm font-semibold text-slate-900">
        Estimated Monthly Spend
      </h3>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-slate-600">
        {comparison.hasCostRange
          ? `Based on your usage, the cheapest option costs ${formatCurrency(
              lowest.totalCost,
            )} per month and the most expensive costs ${formatCurrency(
              highest.totalCost,
            )} per month.`
          : "Every model in the dataset estimates the same cost for this usage."}
      </p>

      {comparison.hasCostRange && potentialPercentageDifference !== null ? (
        <p className="mt-1 text-sm text-slate-600">
          Switching from the most expensive option to the cheapest reduces the
          estimate by{" "}
          <span className="font-medium text-slate-900">
            {formatPercentage(potentialPercentageDifference)}
          </span>
          .
        </p>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">
        Compared on estimated cost only. Model quality, latency and capability
        are not measured.
      </p>
    </div>
  );
}
