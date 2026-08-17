#!/usr/bin/env python3
"""Generate the curated RaceIQ race library from data/race-manifest.json.

Run from an environment with real network access to FastF1's data
sources (this repository's own build sandbox is deliberately blocked --
see docs/CURRENT_STATE.md). Each manifest entry is generated
independently: one failing (or being unresolvable) doesn't stop the
rest, and everything is summarized at the end so you can see exactly
what to check before committing. scripts/build-race-library.ps1 is the
normal way to invoke this on Windows; it's still a plain script so it
also runs directly:

    python scripts/generate_batch.py                       # every manifest entry
    python scripts/generate_batch.py --year 2024 --event Monaco
    python scripts/generate_batch.py --force                # regenerate even if valid data exists

Then review the output, and if it looks right:
    git add data/generated
    git commit -m "Generate curated race library"
    git push
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = REPO_ROOT / "data" / "race-manifest.json"

sys.path.insert(0, str(REPO_ROOT / "analysis"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_analysis import slugify  # noqa: E402
from raceiq.schemas import ANALYSIS_VERSION, validate_analysis  # noqa: E402


class ManifestError(ValueError):
    """Raised when the race manifest itself is malformed."""


REQUIRED_ENTRY_KEYS = {"year", "event", "displayName", "category", "featured", "description"}


def load_manifest(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise ManifestError(f"manifest not found: {path}")
    data = json.loads(path.read_text())
    races = data.get("races")
    if not isinstance(races, list) or not races:
        raise ManifestError(f"manifest at {path} has no non-empty 'races' list")
    for i, race in enumerate(races):
        missing = REQUIRED_ENTRY_KEYS - race.keys()
        if missing:
            raise ManifestError(f"manifest entry {i} missing required keys: {sorted(missing)}")
        if not isinstance(race["year"], int):
            raise ManifestError(f"manifest entry {i} has non-integer year: {race['year']!r}")
    return races


def select_races(races: list[dict[str, Any]], year: int | None, event: str | None) -> list[dict[str, Any]]:
    if year is None and event is None:
        return races
    if year is None or event is None:
        raise SystemExit("--year and --event must be supplied together for a single-race run")
    event_lower = event.strip().lower()
    matches = [
        r
        for r in races
        if r["year"] == year and (r["event"].strip().lower() == event_lower or event_lower in r["displayName"].lower())
    ]
    if not matches:
        raise SystemExit(
            f"No manifest entry matches --year {year} --event {event!r}. "
            "Check data/race-manifest.json for the exact 'event' or 'displayName' value."
        )
    return matches


def resolve_event(year: int, event: str) -> tuple[str, int | None]:
    """Resolve a manifest event query against FastF1's own schedule.

    This is a lightweight schedule-only lookup (no lap data), done
    before attempting a full session generation so a bad manifest
    identifier fails fast with FastF1's own reason instead of guessing.
    Returns (official event name, round number).
    """
    import fastf1

    ev = fastf1.get_event(year, event)
    return str(ev["EventName"]), int(ev["RoundNumber"]) if ev["RoundNumber"] is not None else None


def existing_output_path(year: int, event_slug: str, session: str = "R") -> Path:
    return REPO_ROOT / "data" / "generated" / "raceiq" / f"v{ANALYSIS_VERSION}" / str(year) / event_slug / f"{session}.json"


def has_valid_existing_analysis(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        payload = json.loads(path.read_text())
        validate_analysis(payload)
        return True
    except Exception:  # noqa: BLE001 - any read/parse/validation failure means "not valid", not a crash
        return False


def run_one(race: dict[str, Any], force: bool) -> tuple[str, str]:
    """Generate one manifest entry. Returns (status, detail).

    status is one of "generated", "skipped", "failed". Never raises --
    every failure mode is caught and returned so the batch can continue.
    """
    year, event = race["year"], race["event"]

    try:
        official_name, round_number = resolve_event(year, event)
    except Exception as exc:  # noqa: BLE001 - a bad/unresolvable identifier is a per-race failure, not fatal
        return "failed", f"could not resolve event {event!r} for {year} via FastF1: {exc}"

    slug = slugify(official_name)
    round_label = f"round {round_number}" if round_number is not None else "round unknown"
    print(f"  Resolved: {official_name!r} ({round_label}, slug: {slug})")

    out_path = existing_output_path(year, slug)
    if not force and has_valid_existing_analysis(out_path):
        return "skipped", f"already generated and schema-valid at {out_path.relative_to(REPO_ROOT)}"

    proc = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "generate_analysis.py"), str(year), event],
        cwd=REPO_ROOT,
    )
    if proc.returncode != 0:
        return "failed", f"scripts/generate_analysis.py exited {proc.returncode} for {year} {event!r}"

    if not out_path.exists():
        return (
            "failed",
            f"generation reported success but expected output was not found at "
            f"{out_path.relative_to(REPO_ROOT)} -- the manifest's predicted slug ({slug!r}) may not match "
            "the real FastF1 event name; check the 'Wrote ...' path printed above and update the manifest "
            "if needed",
        )
    return "generated", f"wrote {out_path.relative_to(REPO_ROOT)}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Path to the race manifest JSON")
    parser.add_argument("--year", type=int, default=None, help="Generate only this year (requires --event)")
    parser.add_argument("--event", default=None, help="Generate only this event (requires --year)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even when a schema-valid analysis already exists for a race",
    )
    args = parser.parse_args()

    try:
        races = load_manifest(Path(args.manifest))
        selected = select_races(races, args.year, args.event)
    except ManifestError as exc:
        print(f"Manifest error: {exc}", file=sys.stderr)
        return 2

    results: list[tuple[dict[str, Any], str, str]] = []
    for race in selected:
        print(f"\n=== {race['year']} {race['displayName']} ===")
        status, detail = run_one(race, args.force)
        print(f"  {status.upper()}: {detail}")
        results.append((race, status, detail))

    generated = [r for r in results if r[1] == "generated"]
    skipped = [r for r in results if r[1] == "skipped"]
    failed = [r for r in results if r[1] == "failed"]

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for race, status, _ in results:
        marker = {"generated": "OK  ", "skipped": "SKIP", "failed": "FAIL"}[status]
        print(f"  {marker}  {race['year']} {race['displayName']}")

    print(f"\n{len(generated)} generated, {len(skipped)} skipped, {len(failed)} failed (of {len(results)}).")

    if generated:
        print("\nBefore committing, skim each new summary for anything that looks off")
        print("(a driver with an unusually small lap sample dominating a headline,")
        print("a warning you don't understand, etc.) -- see docs/CURRENT_STATE.md")
        print("for real examples this caught before.")
        print("\nThen:")
        print("  git add data/generated")
        print('  git commit -m "Generate curated race library"')
        print("  git push")

    if failed:
        print("\nFailed races (see the detail above for why; rerun individually for the full traceback):")
        for race, _, detail in failed:
            print(f"  {race['year']} {race['displayName']}: {detail}")
            print(f"    python scripts/generate_analysis.py {race['year']} {race['event']!r}")

    return 1 if failed and not generated and not skipped else 0


if __name__ == "__main__":
    raise SystemExit(main())
