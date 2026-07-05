"""Nyata recall scraper (specs §11.3 System C). One-shot, manual re-run — no cron,
no historical backfill. Sources: KPDN (mySAFE portal table) + NPRA (Safety Alerts).
MOH is degraded per S3 (S6_DEGRADE_MOH=true) and never scraped.

Guarantees:
  - Per-source degrade: an unreachable (S3) or runtime-failed source is skipped and
    its seed rows kept (AC10). One dead source never kills the run.
  - Every official_url is verified LIVE and .gov.my before upsert (LC1, specs §6);
    dead / non-gov links are dropped (logged), never inserted.
  - Upsert-only on UNIQUE(source, title, date) — never deletes (AC9); re-runs are
    idempotent (AC8).
  - Exits 0 even if some / all sources fail.

Run from repo root:
  python scraper/recalls.py [--source moh|mysafe|npra] [--dry-run]
"""
import argparse
import json
import os
import sys

# Make `python scraper/recalls.py` work: add repo root (parent of scraper/) so the
# `scraper` package resolves. APPEND (not insert-0) so site-packages still wins for
# `import supabase` — the repo has a local `supabase/` (migrations) dir that would
# otherwise shadow the installed supabase library.
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.append(_REPO_ROOT)

# Print the dry-run JSON as UTF-8 so verbatim titles (®, BM diacritics) survive
# redirection on Windows (default console encoding is cp1252).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

from scraper.config import SOURCES                       # noqa: E402
from scraper.sources import moh, mysafe, npra            # noqa: E402
from scraper.upsert import upsert_records                # noqa: E402
from scraper.verify import is_verifiable                 # noqa: E402

_SCRAPERS = {"moh": moh.scrape, "mysafe": mysafe.scrape, "npra": npra.scrape}


def collect(keys):
    records = []
    for key in keys:
        cfg = SOURCES[key]
        if not cfg.reachable:
            print(f"SKIP {cfg.label} (degraded to seeds)", file=sys.stderr)
            continue
        try:
            got = _SCRAPERS[key]()
        except Exception as e:  # one dead source never kills the run
            print(f"WARN {cfg.label} scrape failed: {e} — keeping seeds",
                  file=sys.stderr)
            continue
        live, dead, invalid = [], 0, 0
        for r in got:
            try:
                r.validate()
            except ValueError as e:
                print(f"DROP invalid {cfg.label} row: {e}", file=sys.stderr)
                invalid += 1
                continue
            if is_verifiable(r.official_url):
                live.append(r)
            else:
                dead += 1
        print(f"{cfg.label}: {len(got)} gathered / {len(live)} live-verified "
              f"/ {dead} dead-or-nongov dropped / {invalid} invalid",
              file=sys.stderr)
        records.extend(live)
    return records


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=list(SOURCES), help="one source only")
    ap.add_argument("--dry-run", action="store_true",
                    help="scrape+verify, print JSON, no DB write")
    args = ap.parse_args()

    keys = [args.source] if args.source else list(SOURCES)
    records = collect(keys)

    if args.dry_run:
        print(json.dumps([r.to_db_row() for r in records], indent=2,
                         ensure_ascii=False))
        print(f"\n[dry-run] {len(records)} verified rows (no write)",
              file=sys.stderr)
        return

    n = upsert_records(records)
    print(f"upserted {n} rows", file=sys.stderr)


if __name__ == "__main__":
    main()
