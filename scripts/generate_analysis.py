#!/usr/bin/env python3
"""Generate one RaceIQ analysis JSON artifact from a live FastF1 session.

This is a controlled, out-of-band generation step, not a live on-demand
request handler. Run it from an environment with network access to
FastF1's data sources, then commit the resulting file. See
docs/ARCHITECTURE.md for why RaceIQ Phase 1 uses precomputed JSON
artifacts instead of an on-demand Python service.

Usage:
    python scripts/generate_analysis.py 2024 Monaco --session R

Output path convention (the RaceIQ cache key):
    data/generated/raceiq/v{analysisVersion}/{year}/{event-slug}/{session}.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "analysis"))

from raceiq.engine import run_analysis  # noqa: E402
from raceiq.schemas import validate_analysis  # noqa: E402


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("year", type=int)
    parser.add_argument("event", type=str, help="FastF1 event name or round identifier")
    parser.add_argument("--session", default="R")
    parser.add_argument("--cache-dir", default=str(REPO_ROOT / "cache"))
    parser.add_argument(
        "--out-root",
        default=str(REPO_ROOT / "data" / "generated" / "raceiq"),
        help="Root directory for generated artifacts",
    )
    args = parser.parse_args()

    result = run_analysis(args.year, args.event, args.session, cache_dir=args.cache_dir)
    validate_analysis(result)

    event_slug = slugify(result["event"]["name"] or args.event)
    out_dir = Path(args.out_root) / f"v{result['analysisVersion']}" / str(args.year) / event_slug
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{args.session}.json"
    out_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")

    print(f"Wrote {out_path}")
    if result["warnings"]:
        print("Warnings:")
        for warning in result["warnings"]:
            print(f"  - {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
