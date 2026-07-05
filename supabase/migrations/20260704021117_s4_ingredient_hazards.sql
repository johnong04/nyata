-- S4 B1: curated cross-jurisdiction ingredient-hazard table (specs §11.3).
-- DATA-INTEGRITY CRITICAL PATH: every row is loaded ONLY via the verified
-- pipeline (scripts/hazards.load.ts) from a dataset where each row has a LIVE
-- re-fetched source_url + a verbatim_quote the page actually contains. No rows
-- from model memory. Service-key write only; public read.
create table public.ingredient_hazards (
  id uuid primary key default gen_random_uuid(),
  ingredient text not null,
  aliases text[] not null default '{}',
  e_number text,
  kind text not null check (kind in ('additive','sugar_sodium','halal_doubtful','allergen','contaminant')),
  classification text not null,           -- e.g. "possible carcinogen (IARC group 2B)"
  authority text not null,                -- e.g. "EFSA" / "IARC" / "US FDA"
  verbatim_quote text not null,           -- exact text present at source_url at verify time
  source_url text not null,               -- live, re-fetched
  jurisdiction text not null,             -- cross-country gap, e.g. "Permitted in Malaysia; banned in the EU (2022)"
  severity text not null check (severity in ('low','med','high')),
  verified_at timestamptz,                -- set by the verify pipeline
  created_at timestamptz not null default now(),
  unique (ingredient, source_url)
);
alter table public.ingredient_hazards enable row level security;

create policy ingredient_hazards_select_public on public.ingredient_hazards
  for select using (true);
-- NO client write policy: service-key only (build-time load). Data-integrity §11.3.

create index ingredient_hazards_e_number_idx on public.ingredient_hazards (e_number);
