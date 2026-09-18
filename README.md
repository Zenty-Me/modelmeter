# ModelMeter

**Know your AI bill before it arrives.**

ModelMeter is a single-page AI API cost calculator. You enter your expected usage — monthly requests, average input tokens and average output tokens — and it estimates the monthly cost for each model in the pricing dataset so you can compare them side by side.

> **Status: Version 0.1 — project scaffold.**
> The app currently ships with a **demo pricing dataset**. It does **not** contain real prices from OpenAI, Anthropic or Google. See [Pricing Data](#pricing-data).

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

4. Models are listed from the lowest to the highest estimated monthly cost, and each card can be expanded into a per-line cost breakdown.

## Features

- Usage calculator with validation for empty, negative and non-numeric input
- Scale presets (Small / Medium / Large) and scenario presets (Custom / Chatbot / RAG / AI Agent)
- Usage summary with formatted token counts (e.g. `100,000`, `200M`)
- Model comparison cards with input / output prices and estimated monthly cost
- Expandable cost breakdown showing the formula behind each number
- Pricing Sources section that tracks where each price must be verified
- Known Limitations section stating what the estimate does **not** cover
- Responsive layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Basic accessibility: labelled inputs, semantic buttons, visible focus states, skip link

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
│   ├── CostEstimator.tsx   # Client component owning the usage state
│   ├── UsageCalculator.tsx
│   ├── UsageSummary.tsx
│   ├── ModelComparison.tsx
│   ├── ModelCard.tsx
│   ├── CostBreakdown.tsx
│   ├── PricingSources.tsx
│   ├── KnownLimitations.tsx
│   └── Footer.tsx
├── lib/
│   ├── types.ts           # Shared domain types
│   ├── pricing.ts         # Pricing dataset (currently demo data)
│   ├── presets.ts         # Usage presets
│   ├── calculator.ts      # Pure calculation functions
│   ├── format.ts          # Number, token and currency formatting
│   └── site.ts            # Site-level constants
└── public/
```

## Pricing Data

**Pricing data must be collected from official provider websites.**

`lib/pricing.ts` currently contains placeholder entries. Every model is flagged with `isDemoData: true`, the UI labels them with a **Demo Data** badge, and a banner on the page states that official pricing will be added before production.

The numbers in `DEMO_PRICING_DATASET` are illustrative only. They were not copied from any provider's pricing page and must not be presented as real API prices.

To replace them with real data:

1. Open each provider's official pricing documentation.
2. Copy the standard (non-batch, non-cached) text token price for input and output.
3. Update the entry in `lib/pricing.ts` and set `isDemoData: false`.
4. Fill in `sourceUrl` and `checkedAt`, then set `isVerified: true` on the matching entry in `PRICING_SOURCES`.
5. Set `LAST_PRICING_REVIEW` to the review date.

Do not use third-party price aggregators. Do not guess prices.

## Known Limitations

- Only standard text token pricing is considered.
- Batch pricing is not included.
- Prompt caching is not included.
- Long-context pricing differences are not included.
- Tool usage and additional API fees are not included.
- Prices may change over time.
- Always verify pricing with the official provider website.

## Deployment

Designed for deployment on [Vercel](https://vercel.com).

Import the repository on Vercel and keep the default settings — no environment variables are required. Vercel detects Next.js automatically and runs `npm run build`.

## Future Improvements

- Official pricing dataset verified against provider documentation
- More AI providers and model tiers
- Prompt caching support
- Batch API pricing
- Long-context pricing tiers
- Shareable cost estimates
- URL query state
- Pricing change history
