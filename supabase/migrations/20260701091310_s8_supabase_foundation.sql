-- S8 Supabase Foundation: schema + RLS for Nyata (specs §4/§6)
-- Tables: profiles, products, verdicts, recalls, scans + feed_items (view)

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  conditions text[] not null default '{}'
    check (conditions <@ array['allergy','diabetic','pregnant','kid']::text[]),
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- auto-provision a profile row on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ products ============
create table public.products (
  barcode text primary key,
  name text,
  brand text,
  ingredients_raw text,
  source text not null check (source in ('off','ocr')),
  cached_at timestamptz not null default now()
);
alter table public.products enable row level security;

create policy products_select_public on public.products
  for select using (true);

-- ============ verdicts ============
create table public.verdicts (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique references public.products(barcode) on delete cascade,
  flags jsonb not null default '[]',
  rating numeric(3,1) not null check (rating between 0 and 10),
  verdict text not null check (verdict in ('SELAMAT','WASPADA','ELAK')),
  summary_bm text,
  summary_en text,
  model text,
  created_at timestamptz not null default now()
);
alter table public.verdicts enable row level security;

create policy verdicts_select_public on public.verdicts
  for select using (true);

-- ============ recalls ============ (legally load-bearing, specs §6)
create table public.recalls (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('mySAFE','MOH','NPRA','KPDN')),
  match_brand text,
  match_product text,
  match_barcode text,
  title text not null,
  official_url text not null,
  date date not null,
  severity text not null default 'elak' check (severity in ('waspada','elak')),
  created_at timestamptz not null default now(),
  unique (source, official_url)
);
alter table public.recalls enable row level security;

create policy recalls_select_public on public.recalls
  for select using (true);
-- NO client write policy: recalls are service-key only (Scrapling job). Legal §6.

-- ============ scans ============
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(barcode) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.scans enable row level security;

create policy scans_select_own on public.scans
  for select using (auth.uid() = user_id);
create policy scans_insert_own on public.scans
  for insert with check (auth.uid() = user_id);

create index scans_user_created_idx on public.scans (user_id, created_at desc);
create index scans_product_idx on public.scans (product_id);

-- ============ feed_items (view) ============
-- Column names aligned to lib/types.ts FeedItem shape for the S13 seam.
create view public.feed_items with (security_invoker = on) as
select
  p.barcode                                          as barcode,
  p.name                                             as name,
  p.brand                                            as brand,
  v.verdict                                          as band,
  v.rating                                           as rating,
  jsonb_array_length(v.flags)                        as flagged_count,
  exists (
    select 1 from public.recalls r
    where (r.match_barcode = p.barcode)
       or (r.match_brand   is not null and lower(r.match_brand)   = lower(p.brand))
       or (r.match_product is not null and lower(r.match_product) = lower(p.name))
  )                                                  as recalled,
  v.created_at                                       as scanned_at
from public.products p
join public.verdicts v on v.product_id = p.barcode
order by recalled desc, v.rating desc, v.created_at desc;
