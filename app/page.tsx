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
            This version runs on a demo pricing dataset. Official prices will be
            added manually once each provider&apos;s pricing page has been
            reviewed.
          </p>
        </div>
      </section>
    </>
  );
}
