import { Hero } from "@/components/Hero";
import { CostEstimator } from "@/components/CostEstimator";
import { PricingSources } from "@/components/PricingSources";
import { KnownLimitations } from "@/components/KnownLimitations";

export default function Home() {
  return (
    <>
      <Hero />
      <CostEstimator />
      <PricingSources />
      <KnownLimitations />

      <section
        id="about"
        className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            About ModelMeter
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            ModelMeter turns expected token usage into a monthly cost estimate
            and compares that estimate across AI models. It is built as a small,
            focused developer tool: enter your volume, read the breakdown, and
            sanity-check a budget before the invoice arrives.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Pricing is maintained by hand from each provider&apos;s official
            documentation. Every entry records the model identifier, the
            standard-tier input and output prices, the pricing mode, the source
            URL and the date it was last verified — see{" "}
            <a
              href="#pricing-sources"
              className="rounded-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Pricing Sources
            </a>
            .
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            ModelMeter compares estimated cost only. It does not rank model
            quality.
          </p>
        </div>
      </section>
    </>
  );
}
