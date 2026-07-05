# scraper/spike/probe.py — S3 recall-scraper spike shared harness (THROWAWAY).
# Legal (specs §6/§11.2): official .gov.my sources only; neutral fields only;
# every row needs a LIVE official link or it is dropped. No DB writes.
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")
SAMPLES = Path(__file__).parent / "samples"


def is_official(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return host.endswith(".gov.my")


def fetch_static(url: str):
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=30)
        if r.status_code != 200:
            return None
        # Prefer the page's declared/apparent charset so verbatim titles keep
        # their real characters (registered marks, BM diacritics) instead of
        # mojibake — the title is legally load-bearing (must be the source's words).
        r.encoding = r.apparent_encoding or "utf-8"
        return r.text
    except Exception as e:
        print(f"[static] {url} failed: {e}")
        return None


def fetch_scrapling(url: str, stealth: bool = False):
    try:
        from scrapling.fetchers import Fetcher, StealthyFetcher
        if stealth:
            StealthyFetcher.adaptive = True
            return StealthyFetcher.fetch(url, headless=True, network_idle=True)
        return Fetcher.get(url)
    except Exception as e:
        print(f"[scrapling stealth={stealth}] {url} failed: {e}")
        return None


def url_alive(url: str) -> bool:
    if not is_official(url):
        return False
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=30, allow_redirects=True)
        if r.status_code == 200:
            return True
        h = requests.head(url, headers={"User-Agent": UA}, timeout=30, allow_redirects=True)
        return h.status_code == 200
    except Exception:
        return False


def normalize(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return re.sub(r"\s+", " ", s)


def build_row(source, title, product, brand, reason, date, severity,
              official_url, tool, selectors, notes=""):
    # Legal fail-closed: drop unless title present AND official_url is live-official.
    if not title or not url_alive(official_url):
        print(f"[DROP] title/official_url invalid for: {title!r} / {official_url!r}")
        return None
    if severity not in ("waspada", "elak"):
        severity = "elak"  # conservative default (specs: hazard -> avoid)
    return {
        "source": source,                       # mySAFE|MOH|NPRA|KPDN
        "source_label": source,
        "title": title.strip(),                 # verbatim
        "product": (product or "").strip(),
        "brand": (brand or "").strip(),
        "reason": (reason or "").strip(),       # authority's own stated reason
        "date": date,                            # YYYY-MM-DD
        "severity": severity,
        "official_url": official_url,
        "match_brand": normalize(brand) or None,
        "match_product": normalize(product) or None,
        "match_barcode": None,
        "_tool": tool,                           # requests+parser|scrapling-fetcher|scrapling-stealthy|firecrawl
        "_selectors": selectors,
        "_reachable": True,
        "_notes": notes,
    }


def unreachable(reason: str) -> dict:
    return {"reachable": False, "reason": reason, "degrade_to_seeds": True}


def write_sample(source_key: str, payload: dict) -> None:
    SAMPLES.mkdir(parents=True, exist_ok=True)
    out = SAMPLES / f"{source_key}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[wrote] {out}")
