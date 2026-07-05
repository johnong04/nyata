# Nyata — Recall Scraper Spike Report (S3)

Date: 2026-07-04 · Env: Python 3.10.11, Scrapling 0.4.9 (stealth browser installed & working) ·
Legal basis: specs §6, §11.2. Scope: reachability + extraction feasibility for mySAFE/KPDN, NPRA,
MOH FSQ. **This is the S3 reachability spike, NOT the S6 scraper, and it writes NO DB rows.**

## Decision matrix

| Source | `source` enum | Reachable? | Chosen tool (lightest rung) | Entry URL | Sample row | Degrade flag |
|---|---|---|---|---|---|---|
| mySAFE/KPDN | KPDN | **YES** | `requests+parser` | `https://mysafe.kpdn.gov.my/portal/post/3` | `spike/samples/kpdn.json` | `S6_DEGRADE_KPDN=false` |
| NPRA | NPRA | **YES** | `requests+parser` | `https://www.npra.gov.my/index.php/en/health-professionals/safety-alertsen.html` | `spike/samples/npra.json` | `S6_DEGRADE_NPRA=false` |
| MOH FSQ | MOH | **NO (RED)** | `UNREACHABLE` (all rungs incl. stealth + Firecrawl-check) | candidates dead / no recall listing | `spike/samples/moh.json` | `S6_DEGRADE_MOH=true` |

**Ladder outcome: 2 of 3 sources reach on the LAZIEST rung** (`requests+parser`, no browser). Scrapling's
stealth browser is installed and confirmed working (it passed the MOH `www` WAF 403 → 200), but neither
green source needed it — both serve their recall content server-side in static HTML.

## Per-source detail

### mySAFE/KPDN — `requests+parser` (GREEN)
- **Structure:** server-rendered. The portal page `/portal/post/3` renders the individual product-recall
  list as `<table class="table table-bordered table-striped">`. Columns: `#` · **Product Name** ·
  Product Category · Image · **Notice of Recall** · **Date of Recall** (`DD-MM-YYYY`) · Relevant Website.
- **Working selectors:** table `table.table-bordered.table-striped`; rows `tbody tr`; product
  `td:nth-child(2)`; reason `td:nth-child(5)`; date `td:nth-child(6)`. (~10 rows on the first page;
  `?page=N` pagination exists but the individual table is already fully in static HTML.)
- **`official_url` choice (legal):** the table's "Relevant Website" column links to the **brand's own**
  external site (e.g. `thermosmalaysia.com`) — **non-`.gov.my`**, so it is NOT used as the source link.
  The captured `official_url` is the mySAFE portal listing itself (`mysafe.kpdn.gov.my/...`, `.gov.my`,
  live 200) — exactly the seed precedent.
- **Sample row (verbatim title):** "Thermos® Stainless King Food Jars (SK3000 & SK3020 Series)" —
  date `2026-06-24`, severity `waspada` (preemptive replacement program → softer advisory), matches the
  existing Thermos seed. `match_brand=thermos`, `match_product=thermos stainless king food jars sk3000 sk3020 series`.
- **Anti-bot:** none on the static rung (plain `requests` + browser UA returns 200). Also serves a
  coarser JSKBP meeting-period recall-notice PDF list (grouped bundles) higher on the same page — the
  per-product table is the better S6 target.

### NPRA — `requests+parser` (GREEN)
- **Structure:** Joomla + SP Page Builder. The Safety Alerts index server-renders article anchors whose
  href contains `safety-alerts-main` (year in the path, e.g. `…/safety-alerts-2026/…`). The published
  date is NOT on the index; it is on each article page as `<time datetime="…">` and a `.published` span
  ("13 May 2026") — a cheap second static GET yields it.
- **Working selectors:** index article link `a[href*="safety-alerts-main"]`; article date
  `time[datetime]` (fallback `.published`). Same article family as the verified 17-OHPC seed
  (`safety-alerts-2024`).
- **Sample row (verbatim title):** "Clindamycin Hydrochloride (Oral Capsules): Risk of Oesophagitis and
  Oesophageal Ulcer" — date `2026-05-13`, severity `elak`, `official_url` a live `.gov.my` article URL.
  `match_product` normalized; `match_brand=null` (drug-substance alert, no brand — matcher keys on product).
- **Adulterated-products note:** the older `…/adulterated-poducts-unregistered` list is deprecated
  ("no longer updated") and points to the Pharmacy Enforcement banned-product SPA at
  `https://pharmacy.moh.gov.my/ms/apps/banned-product` (kept as a rung-4 SPA fallback in the probe, NOT
  needed for the green result). The live, dated, most-defensible NPRA rows are the **Safety Alerts**
  articles — use those for S6.

### MOH FSQ — RED (`UNREACHABLE`, no seed fallback)
Full ladder run against all three mapped candidates; per-host evidence (see `samples/moh.json`):
- `https://fsq.moh.gov.my` → **DNS-dead (NXDOMAIN)** — the subdomain no longer resolves (fails on every
  rung, including the browser: `net::ERR_NAME_NOT_RESOLVED`). The URL map is stale.
- `https://hq.moh.gov.my/fsq` → **connection timeout** on every rung (host unreachable from here). Search
  confirms this path *exists* (`hq.moh.gov.my/fsq/`), so re-probe from a non-sandbox network in S6 — but
  it is a division landing page, not a consumer recall feed.
- `https://www.moh.gov.my/en/…/food-safety-and-quality-programme` → **reachable** (plain `requests` = 403
  WAF, but Scrapling **StealthyFetcher passed it → 200**). However the page is a **programme-description
  page with NO recall/alert listing** — no anchor matching recall/penarikan/amaran/alert.
- **Firecrawl / web-search check:** MOH food-safety data lives in **FoSIM** (`fsis2.moh.gov.my/fosimv2/`,
  an export-certificate / facility-listing system) and `hq.moh.gov.my/fsq` — **neither is a consumer
  food-recall list.** MOH food recalls surface as FoSIM entries, news posts, or PDF circulars; **no clean
  public HTML recall table exists.** This matches the plan's flagged risk for the hardest source.
- **Conclusion:** MOH is genuinely RED — a mix of dead/renamed hosts and the absence of any public recall
  listing, **not** a blanket sandbox block (proven: `www.moh.gov.my` is reachable here). No row captured;
  **none fabricated** (that is the exact §6 defamation exposure the design avoids).

## S6 recommendation

- **Build the scraper for:** **KPDN** (mySAFE portal table, `requests+parser`) and **NPRA** (Safety
  Alerts index → article date, `requests+parser`). Both are green on the laziest rung — no browser needed,
  cheap and robust for the one-shot S6 populate. Keep Scrapling `StealthyFetcher` in the toolbox only as
  an escalation (it works; it is just unnecessary for these two).
- **Degrade to seeds for:** **MOH** — `S6_DEGRADE_MOH=true`. **CRITICAL: there is NO MOH seed** (existing
  seeds cover NPRA×1 + KPDN/mySAFE×3, MOH×0). So MOH recall coverage is **simply ABSENT** until a working
  target is found. **Do NOT fabricate a MOH recall to fill the gap.** S6 follow-up: hunt a live MOH target
  (re-probe `hq.moh.gov.my/fsq` off-sandbox; investigate FoSIM `fsis2.moh.gov.my`; consider PDF-circular
  parsing) — treat as a separate discovery task, not a blocker.
- **Per-source tool for S6:** KPDN = `requests+parser` · NPRA = `requests+parser` · MOH = `UNREACHABLE`
  (degrade).
- **Row shape confirmed against the S8 `recalls` contract:** YES. Both captured rows carry
  `source ∈ {KPDN,NPRA}`, verbatim `title`, live `.gov.my` `official_url`, ISO `date`,
  `severity ∈ {waspada,elak}`, `match_barcode=null`. `match_brand`/`match_product` are normalized per
  `lib/recalls/normalize.ts` (lowercase, NFKD diacritics stripped, `[^a-z0-9]+`→space, trimmed) — verified
  (`normalize("Nestlé  MILO®") == "nestle milo"`). S6 can insert the sample rows unchanged.

## Degradation flags (the S6 contract this spike defines)

- `S6_DEGRADE_KPDN=false` → scrape mySAFE/KPDN with `requests+parser`.
- `S6_DEGRADE_NPRA=false` → scrape NPRA Safety Alerts with `requests+parser`.
- `S6_DEGRADE_MOH=true` → **no MOH seed exists**; MOH coverage absent until a target is found (flagged,
  never faked). The invariant holds: an unreachable source degrades to *fewer, verified* rows — never to
  fabricated ones.

## Legal review (LC-1..LC-4) — PASS

- **LC-1** — every captured `official_url` is `.gov.my` and returned 200 at capture time
  (`probe.url_alive` enforces official-domain + live before a row is built; off-domain/dead → dropped).
  KPDN portal URL and NPRA article URL both verified live. **PASS.**
- **LC-2** — only neutral source-authored fields captured (`title` verbatim; `reason` is the authority's
  own text or a neutral source-type descriptor). No Nyata adjective/accusation; the row schema has no
  free-text "assessment" field. **PASS.**
- **LC-3** — no private-individual names captured (KPDN = product/brand; NPRA = drug substance;
  the NPRA article's "Posted By" is a *section* name, not captured). **PASS.**
- **LC-4** — the spike performed **no** DB write and **no** Supabase connection; it wrote only local JSON
  files. **PASS.**

## Build gate (AC-1)

`npm run build` — see `## Build verification` below. This slice added only `scraper/` files (no TS/`app/`/
`lib/` surface), so the build is unaffected; the step proves the guardrail held.

## Follow-up (out of scope for S3)

- **S6 recall-scraper-build:** full Scrapling/requests job → `recalls` table, per the tools above; degrade
  per the flags. This spike hands S6 the targets, selectors, tools, and the confirmed row contract.
- **MOH target discovery:** a dedicated task — the mapped MOH URLs are stale/unreachable and no public
  HTML recall list exists; a working MOH source must be found before MOH gets any coverage.
- The `scraper/spike/` probes are throwaway scaffolding; S6 may reuse `probe.normalize` / the row shape.

## Build verification

`npm run build` on `john-run2` after all spike files were added — **GREEN**:

```
✓ Compiled successfully in 7.6s
✓ Generating static pages using 11 workers (11/11)
Route (app)
┌ ƒ /                              ├ ○ /feed          ├ ○ /scan
├ ○ /_not-found                    ├ ƒ /history       ├ ƒ /share/[barcode]
├ ƒ /api/share-card/[barcode]      ├ ○ /login         └ ○ /signup
├ ƒ /auth/callback                 ├ ƒ /product/[barcode]
                                   ├ ƒ /profile
```

(The `[verdict/off] lookup failed …` lines in the log are pre-existing runtime OpenFoodFacts
fetch-fallback warnings during static generation — not build errors; the route table generated fully
and compilation succeeded.) The spike touched only `scraper/` — no TS/`app/`/`lib/` surface — so the
build could not be turned red by this slice; this confirms the guardrail held.

