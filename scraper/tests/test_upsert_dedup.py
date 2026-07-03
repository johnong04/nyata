"""Offline test for the pre-upsert dedup (no network). A single upsert batch must
not repeat the UNIQUE(source, title, date) conflict key, or Postgres raises
'ON CONFLICT DO UPDATE command cannot affect row a second time'. All KPDN rows
share ONE plain portal official_url, so identity is the notice content."""
from scraper.record import RecallRecord
from scraper.upsert import dedup_db_rows

_PORTAL = "https://mysafe.kpdn.gov.my/portal/post/3"


def _rec(title="SUNDVIK CHANGING TABLE", date="2019-04-30", url=_PORTAL):
    return RecallRecord(source="KPDN", title=title,
                        official_url=url, date=date,
                        brand="sundvik", product=title, severity="elak")


def test_dedup_collapses_same_conflict_key():
    # Same (source, title, date) repeated on the portal collapses to one row,
    # even though every row shares the identical plain portal URL.
    rows = dedup_db_rows([_rec() for _ in range(5)])
    assert len(rows) == 1
    assert rows[0]["official_url"] == _PORTAL


def test_dedup_keeps_distinct_notices_sharing_one_url():
    # Distinct notices (different title/date) share the SAME portal URL yet each
    # survive — identity is content, not URL.
    rows = dedup_db_rows([
        _rec(title="Product A", date="2025-01-01"),
        _rec(title="Product B", date="2025-01-01"),
        _rec(title="Product A", date="2026-02-02"),   # same title, different date
    ])
    assert len(rows) == 3
    assert all(r["official_url"] == _PORTAL for r in rows)
