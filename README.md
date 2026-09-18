# ModelMeter

**Know your AI bill before it arrives.**

ModelMeter is a lightweight developer tool for estimating and comparing AI API costs across OpenAI, Anthropic and Google Gemini using pricing verified from official provider documentation. You enter your expected usage — monthly requests, average input tokens and average output tokens — and it estimates the monthly cost for each model in the dataset so you can compare them side by side.

**Live Demo: <https://modelmeter.vercel.app>**

**Repository: <https://github.com/Zenty-Me/modelmeter>**

> **Status: Version 1.0.**
> Six text models across OpenAI, Anthropic and Google are priced from the providers' own pricing documentation, and published context-length price tiers are applied automatically. See [Pricing methodology](#pricing-methodology) and [Pricing tiers](#pricing-tiers).

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

   Where a provider publishes more than one price for a model depending on how much context a request carries, ModelMeter selects the tier that matches your average input tokens per request before doing the arithmetic. See [Pricing tiers](#pricing-tiers).

4. Models are ranked from the lowest to the highest estimated monthly cost. The cheapest option is labelled **Lowest estimated cost**, and every other model shows how much more it would cost in absolute and percentage terms.

## Features

- Estimate monthly AI API cost from expected usage
- Compare OpenAI, Anthropic and Google Gemini models on the same usage estimate
- Usage calculator with validation for empty, negative and non-numeric input
- Scale presets (Small / Medium / Large) and scenario presets (Custom / Chatbot / RAG / AI Agent)
- Usage summary with formatted token counts (e.g. `100,000`, `200M`)
- Data-driven pricing tiers: provider context thresholds resolve automatically as you type
- Comparison summary showing the lowest estimate, the highest estimate and the potential difference
- Share cost estimates through URL parameters — for example [`/?requests=10000&input=300000&output=1000`](https://modelmeter.vercel.app/?requests=10000&input=300000&output=1000) opens the long-context comparison directly, and a Share button copies the current link
- Model cards with the applied pricing tier, verified input / output prices, estimated input and output cost, pricing mode, source link and verification date
- Long-context badge on cards where a higher context tier is in effect
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
git clone https://github.com/Zenty-Me/modelmeter.git
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
npm test        # unit tests (Vitest)
```

## Testing

```bash
npm test
```

Unit tests cover the pure business logic in `lib/` — pricing tier boundaries, cost calculations, savings calculations and invalid-input edge cases. They run against the real pricing dataset and the real formulas, so a change to a published price or a tier bound is caught here.

There is no browser automation, no component rendering and no visual testing. Styling is verified by eye.

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
│   ├── pricing.ts         # Verified pricing dataset and sources (tier data)
│   ├── pricing-engine.ts  # Pure tier resolution from the tier bounds
│   ├── presets.ts         # Usage presets
│   ├── calculator.ts      # Pure calculation and comparison functions
│   ├── format.ts          # Number, token, currency and date formatting
│   ├── site.ts            # Site-level constants
│   └── __tests__/         # Vitest unit tests for the pure functions above
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
| `pricingTiers` | Ordered list of published price points, base tier first — see [Pricing tiers](#pricing-tiers) |
| `pricingMode` | `standard` — the only service tier compared |
| `contextNotes` | Pricing rules that exist for the model but are out of scope |
| `sourceName` / `sourceUrl` | The official page the price was read from |
| `checkedAt` | Date the price was verified by hand |
| `notes` | What the quoted numbers exclude |

**Why pricing is maintained by hand.** Provider pricing structures differ from one another and change over time. Some providers publish separate tiers for batch processing, prompt caching, priority processing, regional inference and long context prompts. Verifying each price against the provider's own page keeps the comparison transparent and auditable: every number on the page can be traced back to a dated, linked source.

**Scope of the comparison.** Only standard, on-demand text token pricing is compared. Batch, Flex and Fast/Priority tiers, prompt caching, tool and search usage, multi-modal token pricing and regional or enterprise pricing are all excluded. Where a provider publishes a higher tier for the same model, the tier that matches your usage is selected automatically rather than the difference being ignored — see [Pricing tiers](#pricing-tiers).

**Cost only.** ModelMeter compares estimated cost only. It does not rank model quality, latency or capability, and the labels on the page describe cost, not fitness for a task.

### Current dataset

Verified on 2026-09-18.

| Provider | Model | Tier | Input / 1M | Output / 1M |
|---|---|---|---|---|
| OpenAI | `gpt-5.6-luna` | Standard context | $0.20 | $1.20 |
| OpenAI | `gpt-5.6-luna` | Long context | $0.40 | $1.80 |
| OpenAI | `gpt-5.6-terra` | Standard context | $2.00 | $12.00 |
| OpenAI | `gpt-5.6-terra` | Long context | $4.00 | $18.00 |
| Anthropic | Claude Sonnet 5 (`claude-sonnet-5`) | Standard context | $2.00 | $10.00 |
| Anthropic | Claude Opus 5 (`claude-opus-5`) | Standard context | $5.00 | $25.00 |
| Google | Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`) | Standard context | $0.25 | $1.50 |
| Google | Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) | Standard context | $2.00 | $12.00 |
| Google | Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) | Long context | $4.00 | $18.00 |

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

## Pricing tiers

Some providers charge more once a single request carries a lot of context. ModelMeter models that as data rather than as special cases: each model owns an ordered list of pricing tiers, and `lib/pricing-engine.ts` selects the tier whose bounds contain your average input tokens per request.

Tier bounds are inclusive, so a threshold of 272,000 means a request of 272,000 tokens stays on the base tier while 272,001 moves to the long-context tier. Because resolution is a plain numeric comparison over the tier bounds, no component ever tests a model by name.

### Currently supported tier rules

| Provider | Model | Threshold | Base tier | Long-context tier |
|---|---|---|---|---|
| OpenAI | GPT-5.6 Luna | > 272,000 input tokens per request | $0.20 in / $1.20 out | $0.40 in / $1.80 out |
| OpenAI | GPT-5.6 Terra | > 272,000 input tokens per request | $2.00 in / $12.00 out | $4.00 in / $18.00 out |
| Google | Gemini 3.1 Pro Preview | > 200,000 input tokens per request | $2.00 in / $12.00 out | $4.00 in / $18.00 out |

Models without a published threshold — Claude Sonnet 5, Claude Opus 5 and Gemini 3.1 Flash-Lite — have a single tier and are always priced at their standard rate.

### How the threshold is evaluated

A threshold is evaluated against **the average input tokens per request** that you enter, not against a measured distribution of request sizes. This is an approximation: a workload with half its requests at 1,000 tokens and half at 600,000 tokens can average below a threshold while still being billed at the higher tier for its long requests. See [Known Limitations](#known-limitations).

## Known Limitations

- Pricing comparison does not measure model quality, latency or capability — only estimated cost.
- Only standard, on-demand text token pricing is compared.
- Prompt caching is excluded, both cache writes and cache reads.
- Batch, Flex and Fast/Priority pricing tiers are excluded.
- Tool calls, web search, image, audio and video usage are excluded.
- Context tiers are applied for the models where the provider publishes a threshold. Models without a published threshold are estimated at their single standard rate.
- Context-tier calculations use the average input tokens per request. Real workloads with mixed prompt sizes may produce different costs.
- Output token estimates should include billable reasoning/thinking tokens where applicable. ModelMeter does not estimate reasoning token usage for you.
- API pricing changes over time. The official provider pages remain the source of truth.

## Deployment

Designed for deployment on [Vercel](https://vercel.com).

Import the repository on Vercel and keep the default settings — no environment variables are required. Vercel detects Next.js automatically and runs `npm run build`.

## Future Improvements

- Accept a request-size distribution instead of a single average, so mixed short and long requests can be priced exactly
- Prompt caching support
- Batch API pricing
- More AI providers and tier rules
- Pricing change history
