from scraper.severity import severity


def test_recall_words_map_to_elak():
    assert severity("Product Recall of X") == "elak"
    assert severity("Cancellation of Product Registration and Product Recall") == "elak"
    assert severity("Voluntary withdrawal from market") == "elak"


def test_advisory_words_map_to_waspada():
    assert severity("Voluntary replacement program for stopper") == "waspada"
    assert severity("Safety advisory: use with caution") == "waspada"
    # Real KPDN Thermos reason (S3 sample) has no recall word -> waspada.
    assert severity("Preemptive Free Stopper Replacement Program ...") == "waspada"


def test_default_is_elak():
    assert severity("Notis berkaitan produk") == "elak"


def test_only_two_bands_ever():
    for t in ["", "recall", "replacement", "random text", None]:
        assert severity(t) in ("waspada", "elak")
