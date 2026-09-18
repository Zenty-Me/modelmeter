import { SITE_TAGLINE } from "@/lib/site";

const PROVIDER_NAMES = ["OpenAI", "Anthropic", "Google Gemini"];

export function Hero() {
  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Version 0.2 · Verified pricing
        </span>

        <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {SITE_TAGLINE}
        </h1>

        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Estimate and compare AI API costs based on your actual usage.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Compare standard text API pricing across leading AI providers.
        </p>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {PROVIDER_NAMES.map((name) => (
            <li
              key={name}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              {name}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-slate-500">
          Standard text pricing, verified against official provider
          documentation.
        </p>
      </div>
    </section>
  );
}
