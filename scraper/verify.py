"""Re-fetch each official_url before insert; keep only LIVE, OFFICIAL links (LC1,
specs §6). Two gates, both required:

  1. is_official_gov(url)  — host must end in `.gov.my`. A recall row may only
     cite an official Malaysian authority; a non-gov link is dropped, never
     stored (no self-authored / off-source accusation).
  2. is_link_live(url)     — the page must resolve. HEAD first (cheap); fall back
     to a ranged GET for servers that reject HEAD. A 2xx/3xx counts as live;
     anything else (or a network error) => drop the row.

The orchestrator requires BOTH before upsert. Fail closed: no live official link
=> no row.
"""
from urllib.parse import urlparse

import requests

_UA = {"User-Agent": "Mozilla/5.0 (NyataRecallVerifier)"}


def is_official_gov(url: str) -> bool:
    if not url or not url.startswith("http"):
        return False
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return host == "gov.my" or host.endswith(".gov.my")


def is_link_live(url: str, timeout: float = 15.0) -> bool:
    if not url or not url.startswith("http"):
        return False
    try:
        r = requests.head(url, allow_redirects=True, timeout=timeout, headers=_UA)
        if r.status_code in (405, 403) or r.status_code >= 400:
            r = requests.get(url, allow_redirects=True, timeout=timeout,
                             headers={**_UA, "Range": "bytes=0-2048"}, stream=True)
        return 200 <= r.status_code < 400
    except requests.RequestException:
        return False


def is_verifiable(url: str, timeout: float = 15.0) -> bool:
    """Both gates: official .gov.my AND live. Used by the orchestrator."""
    return is_official_gov(url) and is_link_live(url, timeout=timeout)
