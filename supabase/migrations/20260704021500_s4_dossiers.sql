-- S4 B2: live third-party dossiers (specs §11.2/§11.3). Attributed, hedged,
-- credibility-gated reports cached per brand. Service-key write only (runtime
-- cache + build-time prewarm); public read. The numeric verdict NEVER reads
-- this table — dossier is a SEPARATE surface (rating stays ingredient-only).
create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  brand_key text not null unique,        -- normalize(brand)
  product_barcode text,                  -- informational; dossier keyed by brand
  summary_en text not null,
  summary_bm text not null,
  sources jsonb not null default '[]',   -- DossierSource[] (each: name, credibility, snippet, url, date)
  prewarmed boolean not null default false,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dossiers enable row level security;

create policy dossiers_select_public on public.dossiers
  for select using (true);
-- NO client write policy: service-key only. §11.2.

create index dossiers_brand_key_idx on public.dossiers (brand_key);
