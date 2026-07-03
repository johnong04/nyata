"""Shared source machinery for the S3 green path (requests + selectolax). S3 proved
both reachable sources serve recall content in static HTML, so no browser backend
is used here (Scrapling stays an unused escalation per SPIKE_REPORT.md).

Date policy (S3 review note, data-integrity): `to_iso` returns None on an
unparseable/absent date — there is NO placeholder like '2026-01-01'. A row whose
date is None is DROPPED by the source parser, never emitted with a fake date.
"""
import re
from datetime import datetime

import requests
from selectolax.parser import HTMLParser

from scraper.normalize import normalize

_UA = {"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/126.0 Safari/537.36")}

_DATE_FORMATS = ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%d %B %Y",
                 "%d.%m.%Y")


def fetch_static(url: str, timeout: float = 40.0) -> str | None:
    """GET a page as text, preserving the source charset so verbatim titles keep
    their real characters (® , BM diacritics). None on any non-200 / error."""
    try:
        r = requests.get(url, headers=_UA, timeout=timeout)
        if r.status_code != 200:
            return None
        r.encoding = "utf-8" if (r.apparent_encoding or "").lower() in ("utf-8", "utf8") \
            else (r.apparent_encoding or "utf-8")
        return r.text
    except requests.RequestException:
        return None


def to_iso(raw: str | None) -> str | None:
    """Coerce a date string to ISO 'YYYY-MM-DD'. Returns None if unparseable —
    the caller MUST drop the row (no placeholder date, ever)."""
    raw = (raw or "").strip()
    if not raw:
        return None
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", raw)   # already ISO (or ISO datetime)
    if m:
        return m.group(0)
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def slug(s: str) -> str:
    """Stable, deterministic per-notice slug from normalized text (hyphenated).
    Used to synthesise a per-row unique key for sources whose rows share one
    listing URL (see KPDN collision resolution in mysafe.py)."""
    return re.sub(r"[^a-z0-9]+", "-", normalize(s)).strip("-")


def parse(html: str) -> HTMLParser:
    return HTMLParser(html)
