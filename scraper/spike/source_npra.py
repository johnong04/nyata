# scraper/spike/source_npra.py — Source B: NPRA safety alerts / adulterated products.
import re
from selectolax.parser import HTMLParser
from scraper.spike import probe

ALERTS = "https://www.npra.gov.my/index.php/en/health-professionals/safety-alertsen.html"
BANNED_APP = "https://pharmacy.moh.gov.my/ms/apps/banned-product"  # SPA fallback
BASE = "https://www.npra.gov.my"

MONTHS = ("january february march april may june july august "
          "september october november december").split()


def _article_date(article_url):
    # Fetch the article page; NPRA (Joomla) renders the published date as a
    # <time datetime="..."> and a ".published" span (e.g. "13 May 2026").
    html = probe.fetch_static(article_url)
    if not html:
        return "2026-01-01"
    tree = HTMLParser(html)
    t = tree.css_first("time")
    if t and t.attributes.get("datetime"):
        m = re.match(r"(\d{4})-(\d{2})-(\d{2})", t.attributes["datetime"])
        if m:
            return m.group(0)
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", html)
    if m and m.group(2).lower() in MONTHS:
        mo = MONTHS.index(m.group(2).lower()) + 1
        return f"{m.group(3)}-{mo:02d}-{int(m.group(1)):02d}"
    return "2026-01-01"


def try_static(url):
    html = probe.fetch_static(url)
    if not html:
        return None
    tree = HTMLParser(html)
    # REAL DOM (verified live 2026-07-04): NPRA is Joomla + SP Page Builder.
    # Safety-alert articles are anchors whose href contains "safety-alerts-main";
    # the year sits in the path (…/safety-alerts-2026/…). Take the first real one.
    link_el = None
    for a in tree.css('a[href*="safety-alerts-main"]'):
        if (a.text(strip=True) or "") and len(a.text(strip=True)) > 15:
            link_el = a
            break
    if not link_el:
        return None
    title = link_el.text(strip=True)
    href = link_el.attributes.get("href") or url
    official_url = href if href.startswith("http") else BASE + href
    date = _article_date(official_url)
    return probe.build_row(
        source="NPRA", title=title, product=title, brand="",
        reason="NPRA drug-safety alert (pharmacovigilance signal); see official article.",
        date=date, severity="elak",
        official_url=official_url, tool="requests+parser",
        selectors={
            "listing": ALERTS,
            "article_link": 'a[href*="safety-alerts-main"]',
            "date": 'article page <time datetime> / .published span',
        },
        notes="NPRA Joomla safety-alerts index; article link + published date both server-rendered (static).",
    )


def try_scrapling(url, stealth):
    page = probe.fetch_scrapling(url, stealth=stealth)
    if page is None:
        return None
    # Scrapling 0.4 Response: .css(...) -> Selectors; element .text / .attrib.
    els = page.css('a[href*="safety-alerts-main"]')
    a = els[0] if els else None
    if a is None:
        return None
    title = (a.text or "").strip()
    href = a.attrib.get("href") if hasattr(a, "attrib") else None
    if not title or not href:
        return None
    official_url = href if href.startswith("http") else BASE + href
    return probe.build_row(
        source="NPRA", title=title, product=title, brand="",
        reason="NPRA drug-safety alert (pharmacovigilance signal); see official article.",
        date=_article_date(official_url), severity="elak",
        official_url=official_url,
        tool="scrapling-stealthy" if stealth else "scrapling-fetcher",
        selectors={"article_link": 'a[href*="safety-alerts-main"]'},
        notes="escalated from static.",
    )


def run():
    ladder = [
        lambda: try_static(ALERTS),
        lambda: try_scrapling(ALERTS, False),
        lambda: try_scrapling(ALERTS, True),
        lambda: try_scrapling(BANNED_APP, True),  # SPA -> stealth browser
    ]
    for attempt in ladder:
        row = attempt()
        if row:
            probe.write_sample("npra", row)
            print(f"[NPRA] captured via {row['_tool']}")
            return
    # rung 4: Firecrawl the SPA manually if scripted fetchers all failed.
    probe.write_sample("npra", probe.unreachable(
        "NPRA alerts + banned-product SPA failed all scripted rungs; "
        "retry BANNED_APP via firecrawl-scrape skill before declaring red."))
    print("[NPRA] UNREACHABLE (try Firecrawl on the banned-product SPA)")


if __name__ == "__main__":
    run()
