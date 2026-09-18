import type { UsageInput } from "@/lib/types";
import { calculateMonthlyTokens } from "@/lib/calculator";
import { formatNumber } from "@/lib/format";

export function UsageSummary({ usage }: { usage: UsageInput }) {
  const tokens = calculateMonthlyTokens(usage);

  const stats = [
    { label: "Monthly Requests", value: formatNumber(usage.monthlyRequests) },
    { label: "Monthly Input Tokens", value: formatNumber(tokens.inputTokens) },
    { label: "Monthly Output Tokens", value: formatNumber(tokens.outputTokens) },
    { label: "Total Tokens", value: formatNumber(tokens.totalTokens) },
  ];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-semibold text-slate-900">Usage Summary</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {stat.label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
