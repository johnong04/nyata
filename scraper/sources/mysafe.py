"""mySAFE / KPDN consumer-product recalls (label 'KPDN'). S3 GREEN, requests+parser.
Portal `/portal/post/3` renders the individual product-recall list server-side as
<table class="table table-bordered table-striped">. Columns (1-indexed td):
2=Product Name, 5=Notice of Recall (action words), 6=Date of Recall (DD-MM-YYYY).

official_url is the PLAIN, REAL .gov.my portal listing — no invented fragment.
The "Relevant Website" column links to the brand's OWN external, non-.gov.my site
(legally unusable as the source link), so every KPDN row's defensible official_url
is the SAME portal page; that's honest — users land on the real listing that
actually holds every notice. Row identity is therefore NOT the URL: the DB de-
duplicates recalls by (source, title, date) (see the S6 by-content migration and
upsert.py), so distinct notices sharing one portal URL each get their own row.
"""
from scraper.config import SOURCES
from scraper.record import RecallRecord
from scraper.severity import severity
from scraper.sources.base import fetch_static, parse, to_iso


def parse_table(html: str, cfg=None) -> list[RecallRecord]:
    cfg = cfg or SOURCES["mysafe"]
    tree = parse(html)
    tbl = tree.css_first("table.table-bordered")
    if not tbl:
        return []
    out: list[RecallRecord] = []
    for row in tbl.css("tbody tr"):
        tds = row.css("td")
        if len(tds) < 6:
            continue  # header / malformed row
        product = tds[1].text(strip=True)
        reason = tds[4].text(strip=True)
        date_iso = to_iso(tds[5].text(strip=True))
        if not product or not date_iso:
            continue  # fail closed: no product or no real date -> drop (no placeholder)
        out.append(RecallRecord(
            source=cfg.label,                       # 'KPDN'
            title=product,                          # VERBATIM (product name is the notice heading)
            official_url=cfg.list_url,              # PLAIN real portal URL (no fragment)
            date=date_iso,
            brand=product.split(" ")[0] if product else None,   # structured: leading token
            product=product,
            barcode=None,                           # gov recalls carry no GTIN
            severity=severity(reason),              # from the authority's own reason text
        ))
    return out


def scrape() -> list[RecallRecord]:
    cfg = SOURCES["mysafe"]
    seen: set[tuple] = set()                        # dedup by (title, date) content key
    records: list[RecallRecord] = []
    for page in range(1, cfg.max_pages + 1):
        url = cfg.list_url if page == 1 else f"{cfg.list_url}?page={page}"
        html = fetch_static(url)
        if not html:
            break
        page_new = 0
        for r in parse_table(html, cfg):
            # Dedup immediately (INTRA- and cross-page): all KPDN rows share one
            # portal official_url, so identity is the content key (title, date) —
            # the same (source, title, date) the upsert conflicts on. This stops a
            # notice repeated on the portal from duplicating the conflict key.
            key = (r.title, r.date)
            if key in seen:
                continue
            seen.add(key)
            records.append(r)
            page_new += 1
            if len(records) >= cfg.max_items:
                return records
        if page_new == 0:
            break                                   # no fresh rows -> end of list
    return records
