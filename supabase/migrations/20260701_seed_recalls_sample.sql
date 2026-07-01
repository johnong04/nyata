-- S11 recall cross-check: seed a small REAL, official-source verified sample.
-- DATA-INTEGRITY / DEFAMATION CRITICAL PATH (specs §6): every row is a real
-- recall published by an official Malaysian authority. Every `official_url` was
-- verified to resolve LIVE via WebFetch at seed time (2026-07-01). `title` is
-- transcribed verbatim from the official notice. No self-authored accusation.
--
-- match_brand / match_product / match_barcode are PRE-NORMALIZED per
-- lib/recalls/normalize.ts rules (lowercase, punctuation -> space, trimmed;
-- barcode = digits only). The conservative matcher (lib/recalls/match.ts) reads
-- these; it is false-negative biased and never flags a safe product.
--
-- The full Scrapling scraper (specs §10) that keeps this table current is an
-- out-of-scope follow-up; this is a hand-verified sample defining the contract.

-- NOTE (schema adaptation to S8): `source` is constrained to
-- {mySAFE, MOH, NPRA, KPDN}; `severity` to {waspada, elak} (verdict bands);
-- and (source, official_url) is UNIQUE — so each row carries a DISTINCT verified
-- URL. Seed values below conform. lib/recalls/getRecallsForProduct.ts maps
-- elak -> high, waspada -> med when producing the shared Recall.severity.
insert into recalls
  (source, match_brand, match_product, match_barcode, title, official_url, date, severity)
values
  -- 1. NPRA — 17-OHPC / Proluton Depot. DCA cancellation + recall, 3 Oct 2024.
  --    Verified live: npra.gov.my safety-alerts-2024 article (HTTP 200, 2026-07-01).
  ('NPRA',
   'bayer', 'proluton depot', null,
   '17-Hydroxyprogesterone Caproate (17-OHPC): Cancellation of Product Registration and Product Recall',
   'https://www.npra.gov.my/index.php/en/component/content/article/454-english/safety-alerts-main/safety-alerts-2024/1527659-updated-17-hydroxyprogesterone-caproate-17-ohpc-cancellation-of-product-registration-and-product-recall.html',
   '2024-10-03', 'elak'),

  -- 2. KPDN / mySAFE — IKEA 365+ VÄRDEFULL Garlic Press (metal pieces / ingestion), 12 Jun 2025.
  --    Verified live: mysafe.kpdn.gov.my/portal/post/3 (HTTP 200, 2026-07-01).
  ('KPDN',
   'ikea', 'garlic press', null,
   'IKEA 365+ VÄRDEFULL Garlic Press — voluntary product recall (risk of small metal pieces detaching and being ingested with food)',
   'https://mysafe.kpdn.gov.my/portal/post/3',
   '2025-06-12', 'elak'),

  -- 3. KPDN / mySAFE — Philips PerfectCare 8000/9000/Elite steam irons (boiler split), 13 Nov 2024.
  --    Verified live: mysafe.kpdn.gov.my/portal/post/3 (HTTP 200, 2026-07-01).
  ('KPDN',
   'philips', 'perfectcare', null,
   'Philips PerfectCare 8000, 9000 and Elite Series Steam Irons — voluntary product recall (boiler weld seam split)',
   'https://mysafe.kpdn.gov.my/portal/post/3?page=2',
   '2024-11-13', 'elak'),

  -- 4. KPDN / mySAFE — Thermos Stainless King Food Jars (stopper replacement), 24 Jun 2026.
  --    Verified live: mysafe.kpdn.gov.my/portal/post/3?page=1 (HTTP 200, 2026-07-01).
  ('KPDN',
   'thermos', 'stainless king food jar', null,
   'Thermos Stainless King Food Jars (SK3000 & SK3020 Series) — voluntary replacement program (stopper without pressure relief valve)',
   'https://mysafe.kpdn.gov.my/portal/post/3?page=1',
   '2026-06-24', 'waspada');
