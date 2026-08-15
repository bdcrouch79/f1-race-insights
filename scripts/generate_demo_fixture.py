#!/usr/bin/env python3
"""Generate the RaceIQ demo fixture used for interface verification.

This fixture is entirely synthetic. It does not represent any real
Formula 1 session, driver, or result. It exists so the frontend's
race-report route, charts, and social card can be built and reviewed
in a browser before the first real analysis is generated (real
generation requires network access to FastF1's data sources, which is
not available in every environment -- see docs/CURRENT_STATE.md).

Every driver name below is invented. `dataSource` is set to
"demo-fixture" and the frontend must render a visible "sample data"
notice whenever that field has this value; it must never be presented
as a live or real analysis.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "analysis"))

import pandas as pd  # noqa: E402

from raceiq import metrics, narrative  # noqa: E402
from raceiq.schemas import ANALYSIS_VERSION, validate_analysis  # noqa: E402

DRIVERS = {
    "MRC": {"fullName": "J. Marchetti", "team": "Fictional Racing Team", "base": 76.4, "drift": 0.35},
    "BRG": {"fullName": "L. Bergstrom", "team": "Fictional Racing Team", "base": 76.7, "drift": -0.10},
    "DUA": {"fullName": "R. Duarte", "team": "Sample Motorsport", "base": 77.0, "drift": 0.55},
    "NAK": {"fullName": "K. Nakashima", "team": "Sample Motorsport", "base": 77.2, "drift": 0.05},
    "FEN": {"fullName": "T. Fenwick", "team": "Demo Grand Prix Racing", "base": 77.5, "drift": -0.40},
    "OYE": {"fullName": "M. Oyelaran", "team": "Demo Grand Prix Racing", "base": 77.9, "drift": 0.20},
}

LAP_COUNT = 40


def build_laps() -> pd.DataFrame:
    rows: list[dict] = []
    for code, spec in DRIVERS.items():
        for lap in range(1, LAP_COUNT + 1):
            # Deterministic pseudo-noise so laps aren't perfectly linear,
            # without depending on a seeded RNG (keeps regeneration exact).
            wobble = 0.08 * ((lap * 7) % 5 - 2)
            progress = (lap - 1) / (LAP_COUNT - 1)
            lap_time = spec["base"] + spec["drift"] * progress + wobble
            rows.append({"Driver": code, "LapNumber": lap, "LapTimeSeconds": lap_time})
    frame = pd.DataFrame(rows)
    frame["LapTime"] = pd.to_timedelta(frame["LapTimeSeconds"], unit="s")
    return frame.drop(columns=["LapTimeSeconds"])


def main() -> int:
    laps = build_laps()

    pace_ranking = metrics.average_pace(laps)
    top_drivers = [row["driver"] for row in pace_ranking[:5]]
    lap_trends = metrics.lap_trends(laps, top_drivers)
    consistency_ranking = metrics.consistency(laps)
    degradation_ranking = metrics.degradation(laps, top_drivers, sample_size=5)

    narrative_result = narrative.build_summary(
        pace_ranking=pace_ranking,
        consistency_ranking=consistency_ranking,
        degradation_ranking=degradation_ranking,
        warnings=[],
    )

    payload = {
        "analysisVersion": ANALYSIS_VERSION,
        "generatedAt": "2026-01-01T00:00:00+00:00",
        "dataSource": "demo-fixture",
        "event": {
            "year": 2026,
            "round": 0,
            "name": "RaceIQ Demo Grand Prix",
            "session": "R",
            "date": "2026-01-01",
            "circuit": "Sample Circuit (fictional)",
        },
        "availability": {
            "lapTiming": True,
            "telemetry": False,
            "tireCompounds": False,
            "weather": False,
        },
        "summary": narrative_result["summary"],
        "evidence": narrative_result["evidence"],
        "drivers": [
            {"code": code, "fullName": spec["fullName"], "team": spec["team"]}
            for code, spec in DRIVERS.items()
        ],
        "paceRanking": pace_ranking,
        "lapTrends": lap_trends,
        "consistency": consistency_ranking,
        "degradation": degradation_ranking,
        "methodology": {
            "quickLapDefinition": (
                "Demo fixture: synthetic lap times generated for interface "
                "verification, not filtered from a real session."
            ),
            "averagePace": "Mean lap time across a driver's quick laps, ranked fastest to slowest.",
            "consistency": "Standard deviation of lap time across quick laps; lower is steadier.",
            "degradation": (
                "Heuristic comparison of the mean of a driver's first 5 quick laps "
                "against the mean of their last 5; not a stint-aware tire model."
            ),
            "topDriverSelection": "Lap-trend and degradation views are limited to the top 5 drivers by average pace.",
        },
        "warnings": [
            "This is a synthetic demo fixture, not a real race analysis. "
            "No driver, team, or result shown here is real.",
        ],
    }

    validate_analysis(payload)

    out_path = REPO_ROOT / "data" / "fixtures" / "demo-race.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
