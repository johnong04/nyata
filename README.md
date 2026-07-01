<div align="center">

# Nyata

### The fine print, revealed.

Scan any product in Malaysia and get a two-second verdict on what's *really* inside —
hidden additives, halal doubts, and live government recall alerts.

[**▶ Try it live — nyata.vercel.app**](https://nyata.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-live-black?logo=vercel)](https://nyata.vercel.app)
[![License](https://img.shields.io/badge/license-see%20LICENSE-lightgrey)](LICENSE)

</div>

---

## What is Nyata?

**Nyata** (Malay for *"revealed"*) turns the ingredient label nobody reads into a verdict anyone can act on.
Point your camera at a barcode — or snap the label — and Nyata tells you, in plain BM + English:

- 🧪 **What's hiding inside** — additives, excess sugar/sodium, allergens, halal-doubtful ingredients, each flagged per-ingredient.
- 🏛️ **Whether it's been recalled** — cross-checked against official Malaysian government records (MOH, mySAFE/KPDN, NPRA), always linked to the source.
- 📊 **An overall rating** — one glance, one decision.

Every scan produces a clean, shareable **verdict card** — because the best consumer warning is the one people actually post.

> [!NOTE]
> Nyata **informs, it doesn't diagnose.** Recall data is republished from official sources only, with links — never our own accusation. Halal status defers to JAKIM unless official data says otherwise.

<div align="center">
<br>
<!-- Drop the hero verdict-card screenshot here once the card is built: -->
<!-- <img src="docs/verdict-card.png" alt="Nyata verdict card" width="360"> -->
<em>📸 Verdict card preview — coming with the D2 build.</em>
<br><br>
</div>

## Features

| | Feature | How it works |
|---|---|---|
| 📷 | **Instant scan** | Barcode via the native `BarcodeDetector` API → OpenFoodFacts lookup; OCR fallback for thin local coverage. |
| 🤖 | **AI verdict** | Ingredients → Vercel AI SDK (`generateObject`, strict schema) → per-ingredient flags + rating + bilingual summary. |
| 🚨 | **Recall cross-check** | Matched against a live table of scraped official recalls, quoted and sourced. |
| 🪪 | **Personal profile** | Set your conditions (allergy · diabetic · pregnant · buying-for-kid) — Nyata flags what's risky *for you*. |
| 🖼️ | **Shareable verdict card** | Every result renders as a postable image with a deep link back. |
| 📰 | **Hidden Ingredients feed** | A public ranking of worst offenders, sourced only from official records. |

## Tech stack

**Next.js 16** (App Router · PWA · Turbopack · React 19) · **Tailwind v4** · **shadcn/ui + Aceternity UI** ·
**Supabase** (Postgres · Auth · Storage) · **Vercel AI SDK 6** + Gemini (vision OCR + structured verdict) ·
`barcode-detector` ponyfill · **Stripe + ToyyibPay** · **Scrapling** (Python recall scraper) · deployed on **Vercel**.

## Quickstart

```bash
git clone https://github.com/johnong04/nyata.git
cd nyata
npm install

cp .env.example .env.local   # fill Supabase + Gemini keys
npm run dev                  # → http://localhost:3000
```

Requires **Node 20+**. See [`.env.example`](.env.example) for the keys you'll need.

## Roadmap

- [x] **D1** — Scaffold · barcode scan · OpenFoodFacts lookup · deploy
- [ ] **D2** — AI verdict + OCR fallback · shareable verdict card · auth + scan logging
- [ ] **D3** — Recall scraper → cross-check · public Hidden Ingredients feed
- [ ] **D4** — Personal profiles + paywall (ToyyibPay + Stripe)
- [ ] **D5** — Hardening · full BM copy · analytics

## Built in public

Nyata is being built live at **Attention House 2026** — a 5-day filmed hacker house in Johor Bahru, Malaysia (8–12 Jul 2026). Follow the daily build.

## License

See [LICENSE](LICENSE).

<div align="center">
<sub>Made in Malaysia 🇲🇾 · <strong>Nyata</strong> — the fine print, revealed.</sub>
</div>
