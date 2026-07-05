# scraper/spike/source_kpdn.py — Source A: mySAFE/KPDN consumer-product recalls.
# Ladder rung 1 (static) first; escalate only if the row isn't in static HTML.
from selectolax.parser import HTMLParser
from scraper.spike import probe

LISTING = "https://mysafe.kpdn.gov.my/portal/post/3"


def try_static():
    html = probe.fetch_static(LISTING)
    if not html:
        return None
    tree = HTMLParser(html)
    # REAL DOM (verified live 2026-07-04): the portal renders the individual
    # product-recall list SERVER-SIDE as <table class="table table-bordered
    # table-striped">. Columns: # · Product Name · Product Category · Image ·
    # Notice of Recall · Date of Recall (DD-MM-YYYY) · Relevant Website.
    tbl = tree.css_first("table.table-bordered")
    if not tbl:
        return None
    row_el = (tbl.css("tbody tr") or tbl.css("tr"))
    # skip a header-only <tr> (no <td>); take the first real product row.
    data_rows = [r for r in row_el if r.css("td")]
    if not data_rows:
        return None
    tds = data_rows[0].css("td")
    if len(tds) < 6:
        return None
    product = tds[1].text(strip=True)
    reason = tds[4].text(strip=True)
    date = _to_iso(tds[5].text(strip=True))
    brand = product.split(" ")[0] if product else ""
    # "Relevant Website" (tds[6]) points to the BRAND's own page (non-.gov.my);
    # the defensible official link is the mySAFE portal listing itself (.gov.my).
    official_url = LISTING
    # Replacement/preemptive programs are softer advisories -> waspada; a
    # hard-hazard recall -> elak (conservative). Match the source's own language.
    soft = any(k in reason.lower() for k in ("replacement program", "preemptive", "voluntary replacement"))
    severity = "waspada" if soft else "elak"
    return probe.build_row(
        source="KPDN", title=product, product=product, brand=brand,
        reason=reason, date=date, severity=severity,
        official_url=official_url, tool="requests+parser",
        selectors={
            "table": "table.table-bordered.table-striped",
            "row": "tbody tr",
            "product": "td:nth-child(2)",
            "reason": "td:nth-child(5)",
            "date": "td:nth-child(6)",
            "official_url": "portal listing (relevant-website col is brand-external, non-.gov.my)",
        },
        notes="mySAFE/KPDN portal server-rendered recall table; barcode absent in gov recalls (match on brand+product).",
    )


def try_scrapling(stealth):
    page = probe.fetch_scrapling(LISTING, stealth=stealth)
    if not page:
        return None
    title = page.css_first(".post h3::text, article h3::text")  # refine to real DOM
    if not title:
        return None
    title = title.get() if hasattr(title, "get") else str(title)
    href = page.css_first(".post a::attr(href)")
    official_url = (href.get() if hasattr(href, "get") else str(href)) or LISTING
    if official_url and not official_url.startswith("http"):
        official_url = "https://mysafe.kpdn.gov.my" + official_url
    return probe.build_row(
        source="KPDN", title=title, product=title, brand="",
        reason="", date="2026-01-01", severity="elak",
        official_url=official_url,
        tool="scrapling-stealthy" if stealth else "scrapling-fetcher",
        selectors={"title": ".post h3::text", "link": ".post a::attr(href)"},
        notes="escalated from static.",
    )


def _to_iso(s: str) -> str:
    # Portal "Date of Recall" is DD-MM-YYYY (verified live). Also accept an
    # already-ISO string. Fallback keeps a valid date so the row isn't dropped.
    import re
    s = s or ""
    m = re.search(r"(\d{2})-(\d{2})-(\d{4})", s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    return m.group(0) if m else "2026-01-01"


def run():
    for attempt in (try_static, lambda: try_scrapling(False), lambda: try_scrapling(True)):
        row = attempt()
        if row:
            probe.write_sample("kpdn", row)
            print(f"[KPDN] captured via {row['_tool']}")
            return
    probe.write_sample("kpdn", probe.unreachable("all rungs failed for mysafe.kpdn.gov.my"))
    print("[KPDN] UNREACHABLE")


if __name__ == "__main__":
    run()
