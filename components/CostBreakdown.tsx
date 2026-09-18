import type { CostEstimate } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/format";

export function CostBreakdown({
  id,
  estimate,
}: {
  id: string;
  estimate: CostEstimate;
}) {
  const steps = [
    {
      label: "Input",
      formula: `${formatTokens(estimate.monthlyTokens.inputTokens)} tokens × ${formatCurrency(
        estimate.model.inputPricePerMillion,
      )} / 1M`,
      cost: estimate.inputCost,
    },
    {
      label: "Output",
      formula: `${formatTokens(estimate.monthlyTokens.outputTokens)} tokens × ${formatCurrency(
        estimate.model.outputPricePerMillion,
      )} / 1M`,
      cost: estimate.outputCost,
    },
  ];

  return (
    <div
      id={id}
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <dl className="space-y-2 text-xs">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
          >
            <dt className="font-medium text-slate-700">{step.label}</dt>
            <dd className="tabular-nums text-slate-600">
              {step.formula} ={" "}
              <span className="font-semibold text-slate-900">
                {formatCurrency(step.cost)}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-2">
          <dt className="font-semibold text-slate-900">Total</dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {formatCurrency(estimate.totalCost)} / month
          </dd>
        </div>
      </dl>
    </div>
  );
}
