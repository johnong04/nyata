-- S6 recall scraper: dedup recalls by CONTENT, not by URL (specs §6 + John's call).
--
-- WHY: all mySAFE/KPDN recalls live on ONE portal page, so the honest official_url
-- is the SAME plain .gov.my listing for every KPDN row. The old
-- UNIQUE(source, official_url) forced the scraper to invent a fake `#recall-<slug>`
-- fragment per row to keep them distinct — dishonest (the fragment is made up and
-- users land on the page top). We now store the PLAIN real portal URL and make row
-- identity the notice CONTENT: UNIQUE(source, title, date).
--
-- `title` is the VERBATIM official heading (legally load-bearing, §6) and `date` is
-- the real notice date (no placeholders) — together they uniquely identify a notice.
--
-- Existing seed rows stay valid: the 4 rows have distinct titles within their source
--   (NPRA 17-OHPC; KPDN IKEA garlic press / Philips PerfectCare / Thermos Stainless
--   King), so no (source, title, date) collides. NPRA rows keep their real per-article
--   URLs unchanged.

alter table public.recalls
  drop constraint recalls_source_official_url_key;

alter table public.recalls
  add constraint recalls_source_title_date_key unique (source, title, date);
