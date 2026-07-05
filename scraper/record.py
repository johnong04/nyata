"""RecallRecord: one official notice, ready to upsert. Pre-normalizes match keys
to the exact TS contract (lib/recalls/normalize.ts); keeps `title` VERBATIM
(LC2). Fails closed on missing link / date / source (LC1/LC3). `date` must be a
real ISO date — there is NO placeholder fallback (a dateless notice is dropped
upstream, never emitted with a fake date; data-integrity per S3 review note).
"""
import re
from dataclasses import dataclass

from scraper.normalize import normalize, normalize_barcode

VALID_SOURCES = {"MOH", "NPRA", "KPDN"}
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@dataclass
class RecallRecord:
    source: str            # 'MOH' | 'NPRA' | 'KPDN'
    title: str             # VERBATIM official heading
    official_url: str      # live-verified link
    date: str              # ISO 'YYYY-MM-DD'
    brand: str | None      # raw brand (normalized in to_db_row)
    product: str | None    # raw product name (normalized in to_db_row)
    barcode: str | None = None
    severity: str = "elak"

    def validate(self) -> None:
        if self.source not in VALID_SOURCES:
            raise ValueError(f"bad source: {self.source!r}")
        if not (self.title and self.title.strip()):
            raise ValueError("empty title")
        if not (self.official_url and self.official_url.startswith("http")):
            raise ValueError(f"bad official_url: {self.official_url!r}")
        if not _ISO_DATE.match(self.date or ""):
            raise ValueError(f"date not ISO YYYY-MM-DD: {self.date!r}")
        if self.severity not in ("waspada", "elak"):
            raise ValueError(f"bad severity: {self.severity!r}")

    def to_db_row(self) -> dict:
        return {
            "source": self.source,
            "match_brand": normalize(self.brand) or None,
            "match_product": normalize(self.product) or None,
            "match_barcode": normalize_barcode(self.barcode) or None,
            "title": self.title.strip(),
            "official_url": self.official_url.strip(),
            "date": self.date,
            "severity": self.severity,
        }
