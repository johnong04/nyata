-- S5 Personalization: members jsonb on profiles (specs §11.5).
-- Shape: [{ "id": "self", "name": "Saya", "conditions": ["diabetic", ...] }]
-- Closed condition vocabulary is validated app-side (lib/types PersonalCondition).
alter table public.profiles
  add column if not exists members jsonb not null default '[]'::jsonb;

-- Backfill a "self" member for existing profiles so the selector always has ≥1.
update public.profiles
  set members = '[{"id":"self","name":"Saya · Me","conditions":[]}]'::jsonb
  where members = '[]'::jsonb;
