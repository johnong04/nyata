# scraper/spike/source_moh.py — Source C: MOH FSQ food recalls (hardest source).
# NOTE: there is NO MOH seed fallback — a red result here means MOH coverage is
# simply absent until a working target is found (never fabricated).
from selectolax.parser import HTMLParser
from scraper.spike import probe

CANDIDATES = [
    "https://fsq.moh.gov.my",
    "https://hq.moh.gov.my/fsq",
    "https://www.moh.gov.my/en/corporate-info/division-information/food-safety-and-quality-programme",
]

KEYWORDS = ("recall", "penarikan", "amaran", "alert")


def _pick_recall_anchor_selectolax(tree):
    for a in tree.css("a"):
        txt = (a.text(strip=True) or "").lower()
        if any(k in txt for k in KEYWORDS):
            return a
    return None


def try_static(url):
    html = probe.fetch_static(url)
    if not html:
        return None
    tree = HTMLParser(html)
    link = _pick_recall_anchor_selectolax(tree)
    if not link:
        return None
    href = link.attributes.get("href") or url
    official_url = href if href.startswith("http") else url.rstrip("/") + "/" + href.lstrip("/")
    title = link.text(strip=True)
    return probe.build_row(
        source="MOH", title=title, product=title, brand="",
        reason="MOH FSQ food recall/alert (see official page).", date="2026-01-01",
        severity="elak",
        official_url=official_url, tool="requests+parser",
        selectors={"strategy": "anchor-text contains recall/penarikan/amaran/alert"},
        notes="MOH food recalls often PDF/news; may need PDF parse or Firecrawl.",
    )


def try_scrapling(url, stealth):
    page = probe.fetch_scrapling(url, stealth=stealth)
    if page is None:
        return None
    # Scrapling 0.4 Response: .css(...) -> Selectors; element .text / .attrib.
    a = None
    els = page.css("a[href*='recall'], a[href*='penarikan']")
    if els:
        a = els[0]
    else:
        for cand in page.css("a"):
            txt = (getattr(cand, "text", "") or "").lower()
            if any(k in txt for k in KEYWORDS):
                a = cand
                break
    if a is None:
        return None
    href = a.attrib.get("href") if hasattr(a, "attrib") else None
    title = (getattr(a, "text", "") or "MOH FSQ recall").strip()
    if not href:
        return None
    official_url = href if href.startswith("http") else url.rstrip("/") + "/" + href.lstrip("/")
    return probe.build_row(
        source="MOH", title=title, product=title, brand="",
        reason="MOH FSQ food recall/alert (see official page).", date="2026-01-01",
        severity="elak",
        official_url=official_url,
        tool="scrapling-stealthy" if stealth else "scrapling-fetcher",
        selectors={"link": "a[href*='recall'] / anchor-text keyword"}, notes="escalated from static.",
    )


def run():
    probe_log = {}
    for url in CANDIDATES:
        rungs = {}
        for name, attempt in (
            ("requests+parser", lambda u=url: try_static(u)),
            ("scrapling-fetcher", lambda u=url: try_scrapling(u, False)),
            ("scrapling-stealthy", lambda u=url: try_scrapling(u, True)),
        ):
            row = attempt()
            if row:
                probe.write_sample("moh", row)
                print(f"[MOH] captured via {row['_tool']} on {url}")
                return
            rungs[name] = "no recall row"
        probe_log[url] = rungs
    payload = probe.unreachable(
        "MOH FSQ food recall NOT extractable via the mapped candidate URLs. "
        "fsq.moh.gov.my is DNS-dead (NXDOMAIN); hq.moh.gov.my/fsq times out; "
        "www.moh.gov.my division page IS reachable (stealth 200) but is a "
        "programme-description page with NO recall listing. MOH food recalls "
        "surface as FoSIM entries / news posts / PDF circulars — no clean public "
        "HTML recall table exists. S6 has NO MOH seed fallback -> MOH coverage is "
        "ABSENT (flagged, never fabricated).")
    payload["candidates_probed"] = probe_log
    payload["S6_DEGRADE_MOH"] = True
    payload["needs_new_target"] = True
    probe.write_sample("moh", payload)
    print("[MOH] UNREACHABLE - flag: no MOH seed fallback exists")


if __name__ == "__main__":
    run()
