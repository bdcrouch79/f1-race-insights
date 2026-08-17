#!/usr/bin/env python3
"""Validate every committed RaceIQ analysis JSON file against the contract.

This reuses the same structural check the engine itself runs before
writing a file (``raceiq.schemas.validate_analysis``) -- it does not
duplicate or reimplement the contract, it just walks every already-
committed file under data/generated/ and data/fixtures/ and re-checks
it. This is a fast, no-network gate that catches a corrupted or
hand-edited JSON file, or a contract drift after an ANALYSIS_VERSION
bump, independent of pytest and the frontend's own zod validation.

Usage:
    python scripts/validate_generated.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "analysis"))

from raceiq.schemas import SchemaError, validate_analysis  # noqa: E402


def find_analysis_files() -> list[Path]:
    roots = [REPO_ROOT / "data" / "generated", REPO_ROOT / "data" / "fixtures"]
    files: list[Path] = []
    for root in roots:
        if root.exists():
            files.extend(sorted(root.rglob("*.json")))
    return files


def main() -> int:
    files = find_analysis_files()
    if not files:
        print("No generated or fixture JSON files found -- nothing to validate.")
        return 0

    failures: list[tuple[Path, str]] = []
    for path in files:
        rel = path.relative_to(REPO_ROOT)
        try:
            payload = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            failures.append((rel, f"invalid JSON: {exc}"))
            print(f"  FAIL  {rel}: invalid JSON ({exc})")
            continue
        try:
            validate_analysis(payload)
        except SchemaError as exc:
            failures.append((rel, str(exc)))
            print(f"  FAIL  {rel}: {exc}")
            continue
        print(f"  OK    {rel}")

    print(f"\n{len(files) - len(failures)}/{len(files)} files valid.")
    if failures:
        print("\nInvalid files:")
        for rel, reason in failures:
            print(f"  {rel}: {reason}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
