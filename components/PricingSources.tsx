import { ExternalLink } from "lucide-react";
import { PRICING_CHECKED_AT, PRICING_SOURCES } from "@/lib/pricing";
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
          Every price in the dataset is read from the provider&apos;s own
          pricing documentation. Third-party price aggregators are not used.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_SOURCES.map((source) => (
            <li
              key={source.provider}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {source.provider}
                </span>
                {/* Only ever asserts verification when the dataset says so. */}
                {source.isVerified ? (
                  <span className="text-xs font-medium text-emerald-700">
                    Verified
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm font-medium text-slate-900">
                {source.sourceName}
              </p>
              {source.isVerified ? (
                <p className="mt-1 text-xs text-slate-500">
                  Verified {formatCheckedAt(source.checkedAt)}
                </p>
              ) : null}

              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                View official pricing
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Pricing data should be verified against official provider
            documentation.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">
              Last pricing review:
            </span>{" "}
            {formatCheckedAt(PRICING_CHECKED_AT)}
          </p>
        </div>
      </div>
    </section>
  );
}
