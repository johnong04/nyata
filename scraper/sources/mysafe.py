"""mySAFE / KPDN consumer-product recalls (label 'KPDN'). S3 GREEN, requests+parser.
Portal `/portal/post/3` renders the individual product-recall list server-side as
<table class="table table-bordered table-striped">. Columns (1-indexed td):
2=Product Name, 5=Notice of Recall (action words), 6=Date of Recall (DD-MM-YYYY).

KPDN-URL-COLLISION RESOLUTION (S3 review note #1): the "Relevant Website" column
links to the brand's OWN external, non-.gov.my site — legally unusable as the
source link — so every row's defensible official_url is the SAME .gov.my portal
listing. Under UNIQUE(source, official_url) that collapses all KPDN rows into one.
Resolution: append a stable per-notice fragment `#recall-<slug(product)>` to the
listing URL. The fragment is deterministic (idempotent re-runs), unique per
product, and does NOT change what the URL resolves to — verify still fetches the
live .gov.my portal page (LC1 holds). It also cannot collide with the 3 KPDN
seed URLs (which use `?page=N`, no fragment), so seeds are never overwritten.
"""
from scraper.config import SOURCES
from scraper.record import RecallRecord
from scraper.severity import severity
from scraper.sources.base import fetch_static, parse, slug, to_iso


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
        official_url = f"{cfg.list_url}#recall-{slug(product)}"
        out.append(RecallRecord(
            source=cfg.label,                       # 'KPDN'
            title=product,                          # VERBATIM (product name is the notice heading)
            official_url=official_url,
            date=date_iso,
            brand=product.split(" ")[0] if product else None,   # structured: leading token
            product=product,
            barcode=None,                           # gov recalls carry no GTIN
            severity=severity(reason),              # from the authority's own reason text
        ))
    return out


def scrape() -> list[RecallRecord]:
    cfg = SOURCES["mysafe"]
    seen: set[str] = set()                          # dedup by synthesised official_url
    records: list[RecallRecord] = []
    for page in range(1, cfg.max_pages + 1):
        url = cfg.list_url if page == 1 else f"{cfg.list_url}?page={page}"
        html = fetch_static(url)
        if not html:
            break
        page_new = 0
        for r in parse_table(html, cfg):
            # Dedup immediately (INTRA-page too): the portal can list the same
            # product+notice several times, which would collapse to one slug and
            # otherwise duplicate the conflict key in the upsert batch.
            if r.official_url in seen:
                continue
            seen.add(r.official_url)
            records.append(r)
            page_new += 1
            if len(records) >= cfg.max_items:
                return records
        if page_new == 0:
            break                                   # no fresh rows -> end of list
    return records
