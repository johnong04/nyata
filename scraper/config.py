"""Per-source scraper config, transcribed from the S3 spike
(scraper/SPIKE_REPORT.md + scraper/spike/source_*.py, verified live 2026-07-04).

Selectors / tool / reachable are S3's findings — NOT invented here. Source labels
align with the seeded rows so upsert-conflict + degrade share a key space:
MOH->'MOH', NPRA->'NPRA', mySAFE/KPDN->'KPDN'.

Tool note: S3 proved BOTH green sources serve their recall content in static HTML
on the laziest rung (`requests+parser` = requests + selectolax). Scrapling's
stealth browser is installed but unnecessary; using it would re-guess against S3.
So `tool="requests"` for the two green sources.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class SourceConfig:
    label: str              # DB `source`: 'MOH' | 'NPRA' | 'KPDN'
    reachable: bool         # S3 verdict; False => degrade to seeds, never scrape
    tool: str               # 'requests' (static green path per S3)
    list_url: str           # index page listing recent notices
    max_items: int          # cap per source (S3 scope: 20-50)
    row_selector: str       # CSS for each notice row / anchor on the list page
    field_selectors: dict = field(default_factory=dict)
    max_pages: int = 1      # KPDN paginates via ?page=N; NPRA/MOH single index


# mySAFE / KPDN — S3 GREEN (requests+parser). Portal renders the individual
# product-recall list SERVER-SIDE as <table class="table table-bordered
# table-striped">: # | Product Name | Category | Image | Notice of Recall |
# Date of Recall (DD-MM-YYYY) | Relevant Website. official_url = the .gov.my
# portal listing (the "Relevant Website" column is the brand's own external,
# non-.gov.my site — legally NOT used as the source link). Per-row uniqueness is
# synthesised in sources/mysafe.py (see KPDN-URL-collision resolution there).
_MYSAFE = SourceConfig(
    label="KPDN",
    reachable=True,                                       # S3: S6_DEGRADE_KPDN=false
    tool="requests",                                      # S3: requests+parser
    list_url="https://mysafe.kpdn.gov.my/portal/post/3",  # S3 entry URL
    max_items=40,
    max_pages=5,                                          # ?page=N, ~10 rows/page
    row_selector="table.table-bordered tbody tr",         # S3 selectors
    field_selectors={
        "product": "td:nth-child(2)",   # Product Name
        "reason": "td:nth-child(5)",    # Notice of Recall (action words -> severity)
        "date": "td:nth-child(6)",      # Date of Recall (DD-MM-YYYY)
    },
)

# NPRA — S3 GREEN (requests+parser). Joomla + SP Page Builder. Safety-alert
# articles are anchors whose href contains "safety-alerts-main"; the published
# date is NOT on the index — it is on each article page as <time datetime="...">
# (fallback .published). A cheap second static GET per article yields it.
_NPRA = SourceConfig(
    label="NPRA",
    reachable=True,                                       # S3: S6_DEGRADE_NPRA=false
    tool="requests",                                      # S3: requests+parser
    list_url="https://www.npra.gov.my/index.php/en/health-professionals/safety-alertsen.html",
    max_items=30,
    row_selector='a[href*="safety-alerts-main"]',         # S3 selector
    field_selectors={
        "date": "time[datetime]",       # on the article page; fallback .published
    },
)

# MOH FSQ — S3 RED / DEGRADED (S6_DEGRADE_MOH=true). fsq.moh.gov.my is DNS-dead
# (NXDOMAIN); hq.moh.gov.my/fsq times out; www.moh.gov.my division page is
# reachable but has NO recall listing. There is also NO MOH seed row — MOH
# coverage is simply ABSENT (flagged, never fabricated — specs §6). reachable
# is False so the orchestrator SKIPs it and scrapes it zero times.
_MOH = SourceConfig(
    label="MOH",
    reachable=False,                                      # S3: RED, no public recall table
    tool="requests",
    list_url="https://www.moh.gov.my/en/corporate-info/division-information/food-safety-and-quality-programme",
    max_items=40,
    row_selector="a",
    field_selectors={},
)

SOURCES: dict[str, SourceConfig] = {"moh": _MOH, "mysafe": _MYSAFE, "npra": _NPRA}
