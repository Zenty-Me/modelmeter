import { CircleAlert } from "lucide-react";

const LIMITATIONS = [
  "Pricing comparison does not measure model quality, latency or capability — only estimated cost.",
  "Only standard, on-demand text token pricing is compared.",
  "Prompt caching is excluded, both cache writes and cache reads.",
  "Batch, Flex and Fast/Priority pricing tiers are excluded.",
  "Tool calls, web search, image, audio and video usage are excluded.",
  "Long-context price tiers are not applied. Each model is estimated at its base short-context tier, and any published higher tier is stated on the model card.",
  "Input and output tokens are treated as flat averages, so real traffic with mixed prompt sizes will differ.",
  "API pricing changes over time. The official provider pages remain the source of truth.",
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
