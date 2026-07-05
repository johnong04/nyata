# Nyata — Build Spec (v1)

> A build brief for a fresh Claude Code session. Paste into a new `nyata/` repo and build from it.
> Build the minimum that wins the house (below). Do not gold-plate v1.

---

## 0. The hacker house this is for (read first, it shapes every decision)

**Attention House 2026** — a 5-day, filmed hacker house by **PetaniAI** in **Johor Bahru, Malaysia, 8-12 July 2026**.
- **15 teams, ≤3 people each. ONE grand prize: $10,000.**
- **Judged on the COMBINED strength of three metrics, measured over the 5 days** (you must maximize all three together, not one):
  1. **USERS** - new signups / active accounts on the product you ship in the house.
  2. **REVENUE** - real dollars from real customers (Stripe / local payment).
  3. **ATTENTION** - views, watch time, shares on content you post during the 5 days.
- **Thesis: "Distribution is the only moat. Build. Post. Win."** It is a filmed house; you post content daily.
- **Builder:** solo (or ≤3) CS undergrad, Malaysia, low/zero budget.

**What this forces (non-negotiable design constraints):**
- **Web-first, not native.** App-store review (Apple 1-3 days + rejection risk on a health/brand app; Google Play's 14-day closed-testing rule for new accounts) would eat the scoring window. Ship a **mobile web app / PWA** that a TikTok link opens in 2 seconds. (Native wrapper only after the house, if it sticks.)
- **Shareable by construction.** Every core action must produce something postable, because attention is a scored axis.
- **Instant payments on web.** ToyyibPay (FPX/DuitNow, Malaysia) + Stripe (cards/Western). Revenue is the structurally weak axis in SEA, so design for it deliberately.

---

## 1. What Nyata is

**Nyata** (Malay for "revealed"). Scan any product in Malaysia and instantly see what's really in it: bad
additives, halal concerns, and live government recall alerts. It turns the fine print nobody reads into a
two-second verdict you can understand, act on, and share.

**The three axes, mapped to features** (keep the build metric-locked):
| Axis | What drives it in Nyata |
|---|---|
| **Users** | free instant scan + accounts (Supabase auth); zero install friction (PWA from a link) |
| **Revenue** | **personal-profile premium** (allergy / diabetic / pregnant / kid) + one-time "full hazard report" unlock |
| **Attention** | share-ready **verdict card** per scan + public **"Hidden Ingredients" feed** ranking worst offenders |

---

## 2. Core features (MVP to ship in the house)

1. **Scan** - barcode via the browser `BarcodeDetector` API (fallback: `zxing-js`); look the product up in the
   **OpenFoodFacts API**. If not found (MY local-product coverage is thin), **OCR the label** by sending the
   photo to a vision model.
2. **AI verdict** - send ingredients (from OFF or OCR) to a vision/LLM via the **Vercel AI SDK** (`generateObject`
   with a strict schema) → structured result: per-ingredient flags (additive / excess sugar-sodium / halal-doubtful /
   allergen), an overall rating, and a plain-language summary in BM + English.
3. **Recall cross-check** - match the product/brand against a **Supabase table of scraped official recalls**
   (mySAFE/KPDN, MOH Food Safety & Quality, NPRA). Show any hit prominently, **quoting the official source**.
4. **Verdict card** - render the result as a clean share-image (HTML-to-image) with the Nyata brand + a deep link.
   This is the attention engine; make it genuinely postable.
5. **Personal profile (PAID)** - user sets conditions (allergy, diabetic, pregnant, buying-for-kid); Nyata flags
   what's risky *for them specifically*. This layer is the paywall. Unlock via ToyyibPay/Stripe.
6. **Public "Hidden Ingredients" feed** - a scrollable feed ranking worst offenders, sourced **only** from
   official records. Drives repeat visits (retention) and is the front-door content hook.
7. **Accounts** - Supabase auth (email/OTP + Google). Signups = the users metric; log every scan.

**Stretch (only if ahead):** halal status via JAKIM/Verify Halal data; "safe alternative" suggestion (+ affiliate);
scan history; push notifications on new recalls for products you scanned.

---

## 3. Tech stack (agreed + pinned versions)

> Versions verified stable as of **1 Jul 2026** (web search + Context7). Pin majors at install; let patches float (`^`).

| Layer | Choice | Version (Jul 2026) | Why |
|---|---|---|---|
| Runtime | **Node.js** | **20 LTS+** (Next 16 minimum) | hard floor for Next 16 |
| App | **Next.js (App Router), PWA, on Vercel** | **16.2.x** | web-first, no install friction, no review queue; Turbopack default; React 19 |
| Styling | **Tailwind CSS** | **4.3.x** | speed; **v4 = CSS-first config** (`@import "tailwindcss"`, no `tailwind.config.js`) |
| UI components | **shadcn/ui** (CLI copies source into repo) | **CLI v4** | unified Radix UI pkg; `shadcn/skills` gives agents component context; add **shadcn MCP**. Optional: 21st.dev Magic MCP |
| Backend | **Supabase** (Postgres + Auth + Storage) | `@supabase/ssr` **0.12.x**, `@supabase/supabase-js` **2.107.x** | one backend; `@supabase/ssr` (auth-helpers is dead). Do NOT add Convex |
| AI | **Vercel AI SDK** + vision model (Gemini Flash or Claude Haiku for cost) | **AI SDK 6** | OCR + structured verdict via `generateObject` (v6 unifies generate text/object + `output` mode) |
| Barcode | native **`BarcodeDetector`** + **`barcode-detector`** ponyfill | **3.2.x** | ponyfill is ZXing-C++ WASM, opts in only when native absent — replaces legacy `@zxing/browser` |
| Product data | **OpenFoodFacts API** (REST v2) | n/a | free; OCR fallback for thin MY coverage |
| Recalls | **Scrapling** (Python, from hack-ideation) | **0.4.x** (Python ≥3.10) | scrape mySAFE / MOH / NPRA into Supabase; bundled MCP server available |
| Payments | **Stripe** (cards/Western) | `stripe` **22.x** (API `2026-05-27.dahlia`), `@stripe/stripe-js` **9.8.x** | revenue axis; avoids native IAP rules |
| Payments | **ToyyibPay** (MY, FPX/DuitNow) | REST (no SDK) | `createBill` + `getBillTransactions`; no package to pin |

---

## 4. Data model (Supabase, minimal)

- `profiles` - user id, conditions[] (allergy/diabetic/pregnant/kid), is_premium, created_at.
- `products` - barcode (pk), name, brand, ingredients_raw, source (off/ocr), cached_at.
- `verdicts` - product_id, flags jsonb, rating, summary_bm, summary_en, model, created_at (cache to avoid re-calling AI).
- `recalls` - source, product/brand match keys, title, official_url, date, severity (scraped; refreshed by Scrapling).
- `scans` - user_id, product_id, created_at (drives the users metric + history + feed signal).
- `feed_items` - derived "worst offenders" view over verdicts+recalls.

---

## 5. Build order (5-day plan)

- **D1** - Next.js + Tailwind + shadcn scaffold; camera + barcode scan; OFF lookup; raw ingredient display. Deploy to Vercel same day.
- **D2** - Vercel AI SDK verdict (`generateObject` schema) + OCR fallback; verdict card (share-image); Supabase auth + scan logging.
- **D3** - Scrapling job → `recalls` table (mySAFE/MOH/NPRA); recall cross-check in the verdict; public "Hidden Ingredients" feed.
- **D4** - personal profiles + paywall (ToyyibPay + Stripe); polish the verdict card for shareability.
- **D5** - hardening, BM copy, analytics, and a daily-content push. Buffer.
- **Every day:** post the build + "we scanned X" exposé content. The content is part of the product, not an afterthought.

---

## 6. Legal / safety guardrails (do not skip)

- **Defamation:** only republish **official-source** recalls/alerts (MOH/mySAFE/NPRA), always **link the source**,
  and use neutral factual language ("listed in MOH recall dated X"), never your own accusation about a brand.
- **Health claims:** Nyata informs, it does not diagnose. Frame flags as ingredient facts, not medical advice.
- **Halal:** do not assert halal status from your own logic; flag "unclear, verify with JAKIM" unless using official JAKIM data.

---

## 7. Monetization detail (the weak axis, attacked)

- **Premium personal profile** (recurring or one-time unlock): personalized risk flags. Price low (RM5-9 one-time
  or a small monthly), aimed at health-anxious buyers (parents, diabetics, allergy sufferers) who convert best.
- **One-time "full hazard report"** unlock per product. Impulse buy.
- Rails: **ToyyibPay** for Malaysian users (FPX/DuitNow), **Stripe** for anyone abroad. Book first real ringgit in the house.
- Note: SEA monetizes ~5x worse than the West and 5-day subscription revenue is near-zero, so the win on revenue
  = *first real paying customers*, not MRR. Over-index on users + attention, treat revenue as proof-of-willingness.

---

## 8. Brand / UI direction

- **Name:** Nyata. Tone: trustworthy and bold, an exposé you can defend - credible, not clickbait.
- Mobile-first PWA, shadcn + Tailwind, clean and fast. Bilingual BM/English. The verdict card is the hero asset:
  it must look good enough that people *want* to post it.

---

## 9. Out of scope for v1 (ponytail)

- No native app (post-house only). No Convex. No multi-country (Malaysia only). No account-less complexity.
- No self-authored health/brand judgments beyond official records. No affiliate engine at launch (stretch).

---

## 10. Setup notes for the building CC session

- Add the **shadcn MCP** to `.mcp.json` so components stay on current specs.
- Env: `OPENFOODFACTS` (none/public), Supabase URL+keys, the AI provider key, `TOYYIBPAY_*`, `STRIPE_*`.
- Reuse the existing **Scrapling** setup from the hack-ideation repo for the recall scraper.
- Verify firecrawl/Scrapling can reach mySAFE/MOH/NPRA pages early (D1 spike) - that data is load-bearing.

---

## 11. Run-2 decisions (finalized 2026-07-04) — data architecture, legal posture, scan UX

> Supersedes/extends §2, §6, §8 where they conflict. Read before building any Run-2 slice.

### 11.1 Product stance (load-bearing)
Nyata is a **useful consumer-watchdog operating deliberately and responsibly in a legal grey area** — **NOT a justice-warrior** authoring brand accusations. Show cited facts + attributed third-party reports; **let the user decide**. Be *useful* over *righteous*. This resolves every "how bold can we be" question: attributed + hedged + linked = yes; Nyata's own definitive brand verdict = no.

### 11.2 Legal posture (hard rules, all data-integrity/prod rigor)
- **Verdict (numeric rating + band) = INGREDIENT-ONLY**, grounded on the curated hazard table (B1). Defensible as facts about contents. Never driven by news/social.
- **"On the record" dossier = attributed · hedged · credibility-gated** third-party reports (research/news/social). Hedged advice ("some sources report X; you may wish to consider alternatives") is OK; a hard Nyata brand-safety claim is not.
- **Safeguards (hard acceptance criteria):** attribution + working link on every claim · AI credibility-gate (named reputable source only) + small trusted-domain backstop (a *floor, not a fence* — whole web is searched) · disclaimer · "report this / right-of-reply" link · no private individuals. **No manual per-row approval** (velocity) — the AI gate + attribution + takedown carry it.
- Basis: MY Defamation Act 1957 (truth + fair-comment on public-interest matters) + *Walters v. OpenAI* (2025: disclaimers/attribution/responsible-design/no-malice defeat AI-defamation). MY is plaintiff-friendly → residual SLAPP risk accepted, mitigated by the above.
- **Recalls:** official sources only, republish + link, neutral language (§6 unchanged).

### 11.3 Three data systems
- **A — product + verdict** (per scan, organic): OFF REST API (barcode) **or** Gemini OCR (photo) → AI verdict **grounded on B1**. Cached in `products` / `verdicts`. No scraping.
- **B1 — curated hazard table** (built once, VERIFIED): `ingredient/E-number → classification · authority · verbatim_quote · url · jurisdiction`. **`jurisdiction` captures cross-country gaps** (e.g. "allowed MY, banned EU" — E171 titanium dioxide, potassium bromate, BVO). Anti-hallucination = **every row has a live, re-fetched link + verbatim quote; rows whose link 404s or doesn't back the claim are dropped** (hard criterion). Built via WebSearch + Firecrawl/WebFetch + `/deep-research`; **customized to hazardous ingredients common in MY food**.
- **B2 — live dossier** (`dossiers` table; Supabase text, free-tier-fine): **runtime** = single **OpenRouter web-search** call (`google/gemini-2.5-flash` + Exa `web` plugin), cached per brand/product. **Pre-warm ~50 popular MY brands** via `scripts/dossiers.prewarm.ts`. Appears as attributed source cards + hedged summary + credibility labels. No DeepSeek; no agent-reach.
- **C — official recalls**: **Scrapling** scrapes MOH/mySAFE/NPRA → `recalls` table, matched brand+name. **Spike reachability first (S3); degrade to the 4 seeds if red.** Scrapling's *only* job.

### 11.4 Scan identity flow
Barcode = unique **cache/dedup KEY, not a name**. Matrix: OFF-hit → 0 photos · OFF-miss first-discovery → back (ingredients) + front (name), cache under barcode · **later users → barcode only (1 take)** · no barcode → front+back, name-key. **Native camera-capture for sharp OCR photos; live video for barcode only.** Adaptive **hologram scan-guide** overlay: barcode → "snap the ingredients" → "snap the front for recalls & news".

### 11.5 Personalization
Closed **template chips** (diabetic/pregnant/kid/nuts/dairy/gluten/soy/shellfish/HBP — no free-text). **`members jsonb`** on `profiles` (self + kids). Scan-time **"who's this for?"** selector → verdict re-flags per member. **Premium-gated with a STUB unlock** (real payments deferred to a later run).

### 11.6 AI / tooling
**Gemini** (free API) = OCR + verdict. **OpenRouter** (`OPENROUTER_API_KEY`, `gemini-2.5-flash` + Exa web plugin) = live dossier. No DeepSeek. Firecrawl/WebFetch = build-time hazard-source verify. `/deep-research` = hazard-ingredient + brand research. Caches protect quota. UI slices **must invoke `/frontend-design` + `/web-animation-design`**. Run scripts with `node --conditions=react-server --env-file=.env.local --import tsx <script>` (the `server-only` guard needs the RSC condition).

### 11.7 Status (Run 2 shipped 2026-07-05, `john-run2` → PR #1)
Live in Supabase: **74 recalls** (KPDN 43 / NPRA 31) · **34 ingredient_hazards** (7 primary-authority citations, 27 "per Wikipedia · cites {authority}") · **49 pre-warmed dossiers**. Prod env keys set (Gemini + OpenRouter). Recall scraper populates via `python scraper/recalls.py` (MOH skipped — dead source, no fallback).
