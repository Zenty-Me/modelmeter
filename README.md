# ModelMeter

**Know your AI bill before it arrives.**

ModelMeter is a single-page AI API cost calculator. You enter your expected usage — monthly requests, average input tokens and average output tokens — and it estimates the monthly cost for each model in the pricing dataset so you can compare them side by side.

> **Status: Version 0.2 — verified pricing dataset.**
> Six text models across OpenAI, Anthropic and Google are priced from the providers' own pricing documentation. See [Pricing methodology](#pricing-methodology).

## What it does

1. You enter three usage numbers.
2. ModelMeter derives your monthly token volume:

   ```text
   Monthly Input Tokens  = Monthly Requests × Input Tokens Per Request
   Monthly Output Tokens = Monthly Requests × Output Tokens Per Request
   ```

3. For every model in the dataset it calculates:

   ```text
   Input Cost  = Monthly Input Tokens  / 1,000,000 × Input Price
   Output Cost = Monthly Output Tokens / 1,000,000 × Output Price
   Estimated Monthly Cost = Input Cost + Output Cost
   ```

4. Models are ranked from the lowest to the highest estimated monthly cost. The cheapest option is labelled **Lowest estimated cost**, and every other model shows how much more it would cost in absolute and percentage terms.

## Features

- Usage calculator with validation for empty, negative and non-numeric input
- Scale presets (Small / Medium / Large) and scenario presets (Custom / Chatbot / RAG / AI Agent)
- Usage summary with formatted token counts (e.g. `100,000`, `200M`)
- Comparison summary showing the lowest estimate, the highest estimate and the potential difference
- Model cards with verified input / output prices, estimated input and output cost, pricing mode, source link and verification date
- Expandable cost breakdown showing the formula behind each number
- Pricing Sources section linking to each provider's official pricing page
- Known Limitations section stating what the estimate does **not** cover
- Responsive layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Basic accessibility: labelled inputs, semantic buttons, visible focus states, external links marked `noopener noreferrer`

## Tech Stack

| | |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| UI | React, Tailwind CSS |
| Icons | Lucide React |
| Package manager | npm |

No database, no backend, no API keys and no third-party services are used.

## Getting Started

```bash
git clone <your-repository-url>
cd modelmeter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## Project Structure

```text
modelmeter/
├── app/
│   ├── globals.css        # Tailwind entry point + global styles
│   ├── layout.tsx         # Root layout, metadata, header and footer
│   └── page.tsx           # Single-page composition
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── CostEstimator.tsx     # Client component owning the usage state
│   ├── UsageCalculator.tsx
│   ├── UsageSummary.tsx
│   ├── ModelComparison.tsx
│   ├── ComparisonSummary.tsx # Lowest / highest / potential difference
│   ├── ModelCard.tsx
│   ├── CostBreakdown.tsx
│   ├── PricingSources.tsx
│   ├── KnownLimitations.tsx
│   └── Footer.tsx
├── lib/
│   ├── types.ts           # Shared domain types
│   ├── pricing.ts         # Verified pricing dataset and sources
│   ├── presets.ts         # Usage presets
│   ├── calculator.ts      # Pure calculation and comparison functions
│   ├── format.ts          # Number, token, currency and date formatting
│   └── site.ts            # Site-level constants
└── public/
```

## Pricing methodology

ModelMeter uses **manually verified pricing from official provider documentation**. No price is estimated, recalled from memory, or sourced from a third-party price aggregator.

The dataset records the following for every model:

| Field | Meaning |
|---|---|
| `provider` | `OpenAI`, `Anthropic` or `Google` |
| `model` | Model name as published by the provider |
| `modelId` | Exact identifier passed to the provider's API |
| `inputPricePerMillion` | Standard-tier input price per 1M tokens, in USD |
| `outputPricePerMillion` | Standard-tier output price per 1M tokens, in USD |
| `pricingMode` | `standard` — the only tier compared in V0.2 |
| `contextNotes` | Pricing rules that exist for the model but are out of scope |
| `sourceName` / `sourceUrl` | The official page the price was read from |
| `checkedAt` | Date the price was verified by hand |
| `notes` | What the quoted numbers exclude |

**Why pricing is maintained by hand.** Provider pricing structures differ from one another and change over time. Some providers publish separate tiers for batch processing, prompt caching, priority processing, regional inference and long context prompts. Verifying each price against the provider's own page keeps the comparison transparent and auditable: every number on the page can be traced back to a dated, linked source.

**Scope of the comparison.** Only standard, on-demand text token pricing is compared. Batch, Flex and Fast/Priority tiers, prompt caching, tool and search usage, multi-modal token pricing and regional or enterprise pricing are all excluded. Where a provider publishes a higher tier for the same model — for example OpenAI's long-context tier or Google's price for prompts above 200,000 tokens — the base tier is used and the difference is stated on the model card rather than silently ignored.

**Cost only.** ModelMeter compares estimated cost only. It does not rank model quality, latency or capability, and the labels on the page describe cost, not fitness for a task.

### Current dataset

Verified on 2026-09-18.

| Provider | Model | Input / 1M | Output / 1M |
|---|---|---|---|
| OpenAI | `gpt-5.6-luna` | $0.20 | $1.20 |
| OpenAI | `gpt-5.6-terra` | $2.00 | $12.00 |
| Anthropic | Claude Sonnet 5 (`claude-sonnet-5`) | $2.00 | $10.00 |
| Anthropic | Claude Opus 5 (`claude-opus-5`) | $5.00 | $25.00 |
| Google | Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`) | $0.25 | $1.50 |
| Google | Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) | $2.00 | $12.00 |

Sources:

- OpenAI — <https://developers.openai.com/api/docs/pricing>
- Anthropic — <https://platform.claude.com/docs/en/about-claude/pricing>
- Google — <https://ai.google.dev/gemini-api/docs/pricing>

### Refreshing the dataset

1. Open the provider's official pricing page listed above.
2. Read the standard-tier input and output price per 1M tokens.
3. Update the entry in `lib/pricing.ts` and set `checkedAt` to the review date.
4. Update `checkedAt` on the matching entry in `PRICING_SOURCES`.
5. Run `npm run build` and check the comparison still renders.

Do not use third-party price aggregators. Do not guess prices.

## Known Limitations

- Pricing comparison does not measure model quality, latency or capability — only estimated cost.
- Only standard, on-demand text token pricing is compared.
- Prompt caching is excluded, both cache writes and cache reads.
- Batch, Flex and Fast/Priority pricing tiers are excluded.
- Tool calls, web search, image, audio and video usage are excluded.
- Long-context price tiers are not applied. Each model is estimated at its base short-context tier, and any published higher tier is stated on the model card.
- Input and output tokens are treated as flat averages, so real traffic with mixed prompt sizes will differ.
- API pricing changes over time. The official provider pages remain the source of truth.

## Deployment

Designed for deployment on [Vercel](https://vercel.com).

Import the repository on Vercel and keep the default settings — no environment variables are required. Vercel detects Next.js automatically and runs `npm run build`.

## Future Improvements

- Apply published long-context tiers per model instead of the base tier
- Prompt caching support
- Batch API pricing
- More AI providers and model tiers
- Shareable cost estimates
- URL query state
- Pricing change history
