"""Service-key upsert into `recalls`. NON-DESTRUCTIVE: upsert-only on the UNIQUE
(source, official_url) from the S8 migration — re-runs are idempotent and seed
rows are never touched (AC8/AC9). Loads secrets from .env.local; never logs them.
The scraper NEVER issues a DELETE/TRUNCATE — degradation is automatic because an
un-scraped source simply keeps its existing rows.
"""
import os

from dotenv import load_dotenv
from supabase import Client, create_client

from scraper.record import RecallRecord

load_dotenv(".env.local")


def get_client() -> Client:
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SECRET_KEY"]     # service key; server-only secret
    return create_client(url, key)


def upsert_records(records: list[RecallRecord]) -> int:
    rows = [r.to_db_row() for r in records]
    if not rows:
        return 0
    client = get_client()
    # on_conflict = the UNIQUE(source, official_url) from the S8 migration.
    client.table("recalls").upsert(rows, on_conflict="source,official_url").execute()
    return len(rows)
