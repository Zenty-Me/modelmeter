"use client";

import { ChevronDown, ExternalLink, Scale, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { CostComparisonEntry } from "@/lib/types";
import {
  formatCheckedAt,
  formatCompactTokens,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPricePerMillion,
  formatSignedCurrency,
} from "@/lib/format";
import { getContextThreshold, hasMultipleTiers } from "@/lib/pricing-engine";
import { CostBreakdown } from "./CostBreakdown";

type ModelCardProps = {
  entry: CostComparisonEntry;
  /** Hidden when every model costs the same, so no false ranking is implied. */
  hasCostRange: boolean;
};

export function ModelCard({ entry, hasCostRange }: ModelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    estimate,
    isLowestCost,
    absoluteDifference,
    higherThanLowestPercentage,
  } = entry;
  const { model, tier, inputTokensPerRequest } = estimate;
  const breakdownId = `breakdown-${model.id}`;
  const showRanking = hasCostRange && !isLowestCost;
  const showTierBounds = hasMultipleTiers(model);
  const threshold = getContextThreshold(model);

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
          {model.provider}
        </span>
        {isLowestCost && hasCostRange ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
            Lowest estimated cost
          </span>
        ) : null}
        {tier.badgeLabel ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            <Scale className="h-3 w-3" aria-hidden="true" />
            {tier.badgeLabel}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">
        {model.model}
      </h3>
      <p className="mt-0.5 font-mono text-xs text-slate-500">{model.modelId}</p>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
        Estimated Monthly Cost
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {formatCurrency(estimate.totalCost)}
      </p>
      {showRanking ? (
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-medium text-slate-900">
            {formatSignedCurrency(absoluteDifference)}
          </span>{" "}
          vs lowest-cost option
          {higherThanLowestPercentage !== null
            ? ` · ${formatPercentage(higherThanLowestPercentage)} higher than the lowest-cost option`
            : ""}
        </p>
      ) : null}

      <dl className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
        <TierRow label="Pricing tier" value={tier.label} />
        {showTierBounds ? (
          <>
            <TierRow
              label="Your average input"
              // Exact value: at the boundary, `200,001` must not round to `200K`.
              value={`${formatNumber(inputTokensPerRequest)} tokens / request`}
            />
            {threshold !== null ? (
              <TierRow
                label="Pricing threshold"
                value={`${formatCompactTokens(threshold)} tokens / request`}
              />
            ) : null}
          </>
        ) : null}
      </dl>

      <dl className="mt-4 space-y-2 text-sm">
        <DetailRow
          label="Input price"
          value={formatPricePerMillion(tier.inputPricePerMillion)}
        />
        <DetailRow
          label="Output price"
          value={formatPricePerMillion(tier.outputPricePerMillion)}
        />
        <div className="border-t border-slate-200 pt-2">
          <DetailRow
            label="Estimated input cost"
            value={formatCurrency(estimate.inputCost)}
            emphasis
          />
        </div>
        <DetailRow
          label="Estimated output cost"
          value={formatCurrency(estimate.outputCost)}
          emphasis
        />
      </dl>

      {model.contextNotes ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {model.contextNotes}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls={breakdownId}
        className="mt-4 inline-flex items-center gap-1 self-start rounded-md text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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

      <div className="mt-auto space-y-1 pt-4 text-xs text-slate-500">
        <p>Pricing mode: Standard</p>
        <p>
          Pricing source:{" "}
          <a
            href={model.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Official provider documentation
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
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

function TierRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 [&+&]:mt-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-800">{value}</dd>
    </div>
  );
}
