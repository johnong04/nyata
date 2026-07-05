import pytest
from scraper.record import RecallRecord


def _valid(**over):
    base = dict(source="NPRA", title="Product Recall of Foo",
                official_url="https://npra.gov.my/x", date="2024-10-03",
                brand="Bayer", product="Proluton Depot", barcode=None,
                severity="elak")
    base.update(over)
    return RecallRecord(**base)


def test_to_db_row_prenormalizes_keys():
    row = _valid().to_db_row()
    assert row["match_brand"] == "bayer"
    assert row["match_product"] == "proluton depot"
    assert row["match_barcode"] is None
    assert row["title"] == "Product Recall of Foo"     # verbatim, not normalized
    assert row["source"] == "NPRA"


def test_validate_rejects_missing_url():
    with pytest.raises(ValueError):
        _valid(official_url="").validate()


def test_validate_rejects_bad_date():
    with pytest.raises(ValueError):
        _valid(date="Oct 3 2024").validate()


def test_validate_rejects_placeholder_is_still_iso_but_missing_dropped_upstream():
    # A dateless notice never reaches a record: date="" fails validation (fail closed).
    with pytest.raises(ValueError):
        _valid(date="").validate()


def test_validate_rejects_unknown_source():
    with pytest.raises(ValueError):
        _valid(source="Aggregator").validate()


def test_null_brand_still_valid_for_npra_drug_alerts():
    # NPRA drug-substance alerts have no brand; product-only row is still valid
    # (matcher needs BOTH keys to fire, so it simply never matches — safe).
    row = _valid(brand=None).to_db_row()
    assert row["match_brand"] is None
    assert row["match_product"] == "proluton depot"


def test_barcode_kept_when_present():
    row = _valid(barcode="955 0001-2345").to_db_row()
    assert row["match_barcode"] == "95500012345"
