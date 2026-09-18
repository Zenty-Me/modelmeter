import { CircleAlert } from "lucide-react";

const LIMITATIONS = [
  "Only standard text token pricing is considered.",
  "Batch pricing is not included.",
  "Prompt caching is not included.",
  "Long-context pricing differences are not included.",
  "Tool usage and additional API fees are not included.",
  "Prices may change over time.",
  "Always verify pricing with the official provider website.",
];

export function KnownLimitations() {
  return (
    <section
      id="limitations"
      className="scroll-mt-20 border-t border-slate-200 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <CircleAlert
            className="h-4 w-4 text-amber-600"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Known Limitations
          </h2>
        </div>

        <ul className="mt-5 max-w-3xl space-y-2.5">
          {LIMITATIONS.map((limitation) => (
            <li
              key={limitation}
              className="flex items-start gap-3 text-sm text-slate-700"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                aria-hidden="true"
              />
              {limitation}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
