from scraper.normalize import normalize, normalize_barcode


def test_normalize_matches_ts_contract():
    assert normalize("Bayer Proluton® Depot") == "bayer proluton depot"
    assert normalize("IKEA 365+ VÄRDEFULL") == "ikea 365 vardefull"
    assert normalize("  Milo—Milk  ") == "milo milk"
    assert normalize("Café  Latté!!") == "cafe latte"
    assert normalize("") == ""
    assert normalize(None) == ""


def test_normalize_real_source_titles():
    # Verbatim titles S3 captured live must normalize to the seed match keys.
    assert normalize("Thermos® Stainless King Food Jars (SK3000 & SK3020 Series)") == \
        "thermos stainless king food jars sk3000 sk3020 series"
    assert normalize("Nestlé  MILO®") == "nestle milo"


def test_normalize_barcode_digits_only():
    assert normalize_barcode("955 0001-2345") == "95500012345"
    assert normalize_barcode("") == ""
    assert normalize_barcode(None) == ""
    assert normalize_barcode("abc") == ""
