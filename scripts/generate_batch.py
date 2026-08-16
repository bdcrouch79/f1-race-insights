#!/usr/bin/env python3
"""Generate a curated set of real races for a strong first RaceIQ demo.

Run from an environment with real network access to FastF1's data
sources (this repo's own build sandbox is deliberately blocked -- see
docs/CURRENT_STATE.md). Each race is generated independently: one
failing doesn't stop the rest, and everything is printed at the end so
you can see exactly what to check before committing.

Usage:
    python scripts/generate_batch.py

Then review the output, and if it looks right:
    git add data/generated
    git commit -m "Generate curated demo race set"
    git push
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# A deliberately varied set: different circuits, different eras within
# the 2018+ supported range, different kinds of races (title deciders,
# comeback drives, high-speed vs. street circuits). Pick races people
# have actually heard of -- that's what makes the archive feel real
# instead of arbitrary. If an event name doesn't resolve, FastF1's own
# error will say so; try the round number or a different spelling of
# the location instead.
RACES: list[tuple[int, str]] = [
    (2021, "Abu Dhabi"),   # the title-deciding season finale
    (2020, "Sakhir"),      # Perez's win from last after a lap-1 crash
    (2019, "Italy"),       # Monza -- top-speed contrast to Monaco
    (2019, "Brazil"),      # Interlagos, chaotic late-race contact
    (2022, "Japan"),       # Suzuka, a title clinched in the rain
    (2018, "Singapore"),   # street circuit, night race
    (2023, "Las Vegas"),   # the newest circuit on the calendar
    (2018, "Germany"),     # Hockenheim, a wet, chaotic home race
]


def main() -> int:
    results: list[tuple[int, str, bool, str]] = []

    for year, event in RACES:
        print(f"\n=== {year} {event} ===")
        proc = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "generate_analysis.py"), str(year), event],
            cwd=REPO_ROOT,
        )
        results.append((year, event, proc.returncode == 0, ""))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    succeeded = [r for r in results if r[2]]
    failed = [r for r in results if not r[2]]

    for year, event, ok, _ in results:
        print(f"  {'OK  ' if ok else 'FAIL'}  {year} {event}")

    print(f"\n{len(succeeded)} succeeded, {len(failed)} failed.")
    if succeeded:
        print("\nBefore committing, skim each summary for anything that looks off")
        print("(a driver with an unusually small lap sample dominating a headline,")
        print("a warning you don't understand, etc.) -- see docs/CURRENT_STATE.md")
        print("for three real examples this caught before.")
        print("\nThen:")
        print("  git add data/generated")
        print('  git commit -m "Generate curated demo race set"')
        print("  git push")
    if failed:
        print("\nFailed races (rerun individually to see the full error):")
        for year, event, _, _ in failed:
            print(f"  python scripts/generate_analysis.py {year} {event!r}")

    return 1 if failed and not succeeded else 0


if __name__ == "__main__":
    raise SystemExit(main())
