import { ExternalLink } from "lucide-react";
import { LAST_PRICING_REVIEW, PRICING_SOURCES } from "@/lib/pricing";
import { formatCheckedAt } from "@/lib/format";

export function PricingSources() {
  return (
    <section
      id="pricing-sources"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          Pricing Sources
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Official provider pricing pages that will back the pricing dataset.
          Third-party price aggregators are not used.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_SOURCES.map((source) => (
            <li
              key={source.provider}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {source.provider}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {source.isVerified ? "Verified" : "Not verified"}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-slate-900">
                {source.sourceName}
              </p>

              {source.sourceUrl ? (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Open official page
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  URL pending manual verification
                </p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Last checked: {formatCheckedAt(source.checkedAt)}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Pricing data should be verified against official provider
          documentation.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">
            Last pricing review:
          </span>{" "}
          {LAST_PRICING_REVIEW ?? "Not verified yet"}
        </p>
      </div>
    </section>
  );
}
