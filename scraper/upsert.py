"""Service-key upsert into `recalls`. NON-DESTRUCTIVE: upsert-only on the UNIQUE
(source, title, date) from the S6 by-content migration — re-runs are idempotent
and seed rows are never touched (AC8/AC9). Identity is the notice content, not the
URL: KPDN rows all share one honest portal official_url, so uniqueness can't key on
URL. Loads secrets from .env.local; never logs them. The scraper NEVER issues a
DELETE/TRUNCATE — degradation is automatic because an un-scraped source simply
keeps its existing rows.
"""
import os

from dotenv import load_dotenv

from scraper.record import RecallRecord

load_dotenv(".env.local")


def get_client():
    # Lazy import: --dry-run must run without supabase-py installed, and the repo's
    # local `supabase/` (migrations) dir must not be imported in its place.
    from supabase import create_client
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SECRET_KEY"]     # service key; server-only secret
    return create_client(url, key)


def dedup_db_rows(records: list[RecallRecord]) -> list[dict]:
    """Collapse rows sharing the conflict key (source, title, date), keeping the
    first. A single upsert batch must not repeat a conflict key or Postgres errors
    'ON CONFLICT DO UPDATE command cannot affect row a second time'. Duplicates
    here are genuine (identical notice listed twice), so first-wins is lossless.
    Pure — unit-tested offline."""
    seen: set[tuple] = set()
    rows: list[dict] = []
    for r in records:
        row = r.to_db_row()
        key = (row["source"], row["title"], row["date"])
        if key in seen:
            continue
        seen.add(key)
        rows.append(row)
    return rows


def upsert_records(records: list[RecallRecord]) -> int:
    rows = dedup_db_rows(records)
    if not rows:
        return 0
    client = get_client()
    # on_conflict = the UNIQUE(source, title, date) from the S6 by-content migration.
    client.table("recalls").upsert(rows, on_conflict="source,title,date").execute()
    return len(rows)
