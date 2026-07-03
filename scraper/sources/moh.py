"""MOH FSQ food recalls (label 'MOH'). S3 verdict: RED / DEGRADED
(S6_DEGRADE_MOH=true). fsq.moh.gov.my is DNS-dead (NXDOMAIN); hq.moh.gov.my/fsq
times out; www.moh.gov.my's division page has NO recall listing — no clean public
HTML recall table exists. There is ALSO no MOH seed row, so MOH coverage is simply
ABSENT until a working target is found (flagged, never fabricated — specs §6).

`cfg.reachable is False`, so the orchestrator SKIPs this source and never calls
scrape(). This stub exists only to keep the source interface uniform; if invoked
it returns [] rather than inventing rows.
"""
from scraper.config import SOURCES
from scraper.record import RecallRecord


def scrape() -> list[RecallRecord]:
    # Degraded per S3. Never fabricate a MOH recall to fill the gap.
    return []
