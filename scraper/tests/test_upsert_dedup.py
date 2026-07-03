"""Offline test for the pre-upsert dedup (no network). A single upsert batch must
not repeat the UNIQUE(source, official_url) conflict key, or Postgres raises
'ON CONFLICT DO UPDATE command cannot affect row a second time'."""
from scraper.record import RecallRecord
from scraper.upsert import dedup_db_rows


def _rec(url, title="SUNDVIK CHANGING TABLE"):
    return RecallRecord(source="KPDN", title=title,
                        official_url=url, date="2019-04-30",
                        brand="sundvik", product=title, severity="elak")


def test_dedup_collapses_same_conflict_key():
    url = "https://mysafe.kpdn.gov.my/portal/post/3#recall-sundvik-changing-table"
    rows = dedup_db_rows([_rec(url) for _ in range(5)])
    assert len(rows) == 1
    assert rows[0]["official_url"] == url


def test_dedup_keeps_distinct_urls():
    rows = dedup_db_rows([
        _rec("https://mysafe.kpdn.gov.my/portal/post/3#recall-a"),
        _rec("https://mysafe.kpdn.gov.my/portal/post/3#recall-b"),
    ])
    assert len(rows) == 2
