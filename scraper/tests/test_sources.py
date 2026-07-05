"""Offline parser tests (CI-provable) against S3-captured HTML fixtures.
Fixtures are authentic trimmed captures of the live .gov.my pages (2026-07-04):
  - mysafe.html      : the real <table class="table table-bordered table-striped">
  - npra_index.html  : the real safety-alerts-main article anchors
  - npra_article.html: the real <time datetime> from the top article
"""
from pathlib import Path

from scraper.config import SOURCES
from scraper.sources import mysafe, npra

FIX = Path(__file__).parent / "fixtures"


def _html(name):
    return (FIX / name).read_text(encoding="utf-8")


# ---------- KPDN / mySAFE ----------

def test_mysafe_fixture_yields_kpdn_rows():
    records = mysafe.parse_table(_html("mysafe.html"))
    assert len(records) >= 1
    assert all(r.source == "KPDN" for r in records)          # aligns with seeds
    top = records[0]
    # verbatim heading, ® preserved (title is legally load-bearing):
    assert top.title == "Thermos® Stainless King Food Jars (SK3000 & SK3020 Series)"
    assert top.date == "2026-06-24"
    assert top.severity == "waspada"                          # reason = replacement program
    row = top.to_db_row()
    assert row["match_brand"] == "thermos"
    assert row["match_product"] == "thermos stainless king food jars sk3000 sk3020 series"
    assert row["match_barcode"] is None


def test_kpdn_official_url_is_plain_portal_no_fragment():
    """Every KPDN row stores the PLAIN real portal listing URL — no invented
    #recall-<slug> fragment. Rows are distinguished by content (title, date),
    not URL (see the S6 by-content dedup)."""
    records = mysafe.parse_table(_html("mysafe.html"))
    urls = [r.official_url for r in records]
    assert all(u == "https://mysafe.kpdn.gov.my/portal/post/3" for u in urls)
    assert all("#" not in u for u in urls)                   # no fake fragment
    # Content keys stay distinct so the (source, title, date) upsert never collides.
    keys = [(r.source, r.title, r.date) for r in records]
    assert len(keys) == len(set(keys))


def test_kpdn_dateless_row_is_dropped_no_placeholder():
    """A row with an empty date cell is dropped, NOT emitted with a fake date."""
    html = """<table class="table table-bordered table-striped"><tbody>
      <tr><td>1</td><td>Good Product</td><td>Cat</td><td>img</td>
          <td>Voluntary product recall</td><td>24-06-2026</td><td>site</td></tr>
      <tr><td>2</td><td>Dateless Product</td><td>Cat</td><td>img</td>
          <td>Some recall</td><td></td><td>site</td></tr>
    </tbody></table>"""
    records = mysafe.parse_table(html)
    titles = [r.title for r in records]
    assert "Good Product" in titles
    assert "Dateless Product" not in titles                  # dropped, no 2026-01-01
    assert all(len(r.date) == 10 for r in records)


# ---------- NPRA ----------

def test_npra_index_yields_verbatim_titles_and_gov_urls():
    pairs = npra.parse_index(_html("npra_index.html"))
    assert len(pairs) >= 1
    title, url = pairs[0]
    assert title == ("Clindamycin Hydrochloride (Oral Capsules): "
                     "Risk of Oesophagitis and Oesophageal Ulcer")
    assert "npra.gov.my" in url and "safety-alerts-main" in url
    assert url.startswith("http")


def test_npra_article_date_extraction():
    assert npra.extract_date(_html("npra_article.html")) == "2026-05-13"
    assert npra.extract_date("<html><body>no date here</body></html>") is None


def test_npra_record_shape_from_fixtures():
    title, url = npra.parse_index(_html("npra_index.html"))[0]
    date = npra.extract_date(_html("npra_article.html"))
    from scraper.record import RecallRecord
    from scraper.severity import severity
    rec = RecallRecord(source="NPRA", title=title, official_url=url, date=date,
                       brand=None, product=title, severity=severity(title))
    rec.validate()                                           # must not raise
    row = rec.to_db_row()
    assert row["source"] == "NPRA"
    assert row["match_brand"] is None                        # drug-substance alert
    assert row["match_product"] == \
        "clindamycin hydrochloride oral capsules risk of oesophagitis and oesophageal ulcer"
