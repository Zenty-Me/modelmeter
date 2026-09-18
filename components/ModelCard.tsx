"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CostEstimate } from "@/lib/types";
import {
  formatCheckedAt,
  formatCurrency,
  formatPricePerMillion,
} from "@/lib/format";
import { CostBreakdown } from "./CostBreakdown";

export function ModelCard({ estimate }: { estimate: CostEstimate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { model } = estimate;
  const breakdownId = `breakdown-${model.id}`;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
          {model.provider}
        </span>
        {model.isDemoData ? (
          <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Demo Data
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">
        {model.model}
      </h3>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
        Estimated Monthly Cost
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {formatCurrency(estimate.totalCost)}
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        <DetailRow
          label="Input price"
          value={formatPricePerMillion(model.inputPricePerMillion)}
        />
        <DetailRow
          label="Output price"
          value={formatPricePerMillion(model.outputPricePerMillion)}
        />
        <div className="border-t border-slate-200 pt-2">
          <DetailRow
            label="Input cost"
            value={formatCurrency(estimate.inputCost)}
            emphasis
          />
        </div>
        <DetailRow
          label="Output cost"
          value={formatCurrency(estimate.outputCost)}
          emphasis
        />
      </dl>

      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls={breakdownId}
        className="mt-4 inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
        {isExpanded ? "Hide cost breakdown" : "Show cost breakdown"}
      </button>

      {isExpanded ? (
        <CostBreakdown id={breakdownId} estimate={estimate} />
      ) : null}

      <div className="mt-auto pt-4 text-xs text-slate-500">
        <p>Pricing source: {model.sourceName}</p>
        <p>Last checked: {formatCheckedAt(model.checkedAt)}</p>
      </div>
    </article>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  emphasis?: boolean;
};

function DetailRow({ label, value, emphasis = false }: DetailRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`tabular-nums ${
          emphasis ? "font-medium text-slate-900" : "text-slate-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
