"""NPRA drug-safety alerts (label 'NPRA'). S3 GREEN, requests+parser. Joomla +
SP Page Builder: the Safety Alerts index server-renders article anchors whose
href contains "safety-alerts-main". The published date is NOT on the index — it
is on each article page as <time datetime="..."> (fallback a ".published" span
like "13 May 2026"), so a cheap second static GET per article yields it.

Dates (S3 review note #2): if an article has no parseable date, the row is
DROPPED — never emitted with a placeholder date.
match_brand is null (drug-substance alerts have no brand); the conservative
matcher keys on product, and with a null brand it simply never fires (safe).
"""
import re

from scraper.config import SOURCES
from scraper.record import RecallRecord
from scraper.severity import severity
from scraper.sources.base import fetch_static, parse, to_iso

_BASE = "https://www.npra.gov.my"
_MONTHS = ("january february march april may june july august "
           "september october november december").split()


def parse_index(html: str, cfg=None) -> list[tuple[str, str]]:
    """(title, official_url) pairs from the Safety Alerts index. Verbatim titles;
    absolute .gov.my article URLs. Deduped, capped at cfg.max_items."""
    cfg = cfg or SOURCES["npra"]
    tree = parse(html)
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for a in tree.css(cfg.row_selector):
        title = (a.text(strip=True) or "")
        href = a.attributes.get("href") or ""
        if len(title) <= 15 or not href:
            continue
        url = href if href.startswith("http") else _BASE + href
        if url in seen:
            continue
        seen.add(url)
        out.append((title, url))
        if len(out) >= cfg.max_items:
            break
    return out


def extract_date(article_html: str) -> str | None:
    """ISO date from an article page: <time datetime> first, then a
    '<d> <Month> <YYYY>' string (e.g. '.published' span). None if absent."""
    if not article_html:
        return None
    tree = parse(article_html)
    t = tree.css_first("time")
    if t and t.attributes.get("datetime"):
        iso = to_iso(t.attributes["datetime"])
        if iso:
            return iso
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", article_html)
    if m and m.group(2).lower() in _MONTHS:
        mo = _MONTHS.index(m.group(2).lower()) + 1
        return f"{m.group(3)}-{mo:02d}-{int(m.group(1)):02d}"
    return None


def scrape() -> list[RecallRecord]:
    cfg = SOURCES["npra"]
    index_html = fetch_static(cfg.list_url)
    if not index_html:
        return []
    records: list[RecallRecord] = []
    for title, url in parse_index(index_html, cfg):
        article_html = fetch_static(url)
        date_iso = extract_date(article_html)
        if not date_iso:
            continue  # fail closed: no real date -> drop (no placeholder)
        records.append(RecallRecord(
            source=cfg.label,          # 'NPRA'
            title=title,               # VERBATIM article heading
            official_url=url,
            date=date_iso,
            brand=None,                # drug-substance alert: no brand
            product=title,             # structured: the alert subject
            barcode=None,
            severity=severity(title),  # from the article's own action words
        ))
    return records
