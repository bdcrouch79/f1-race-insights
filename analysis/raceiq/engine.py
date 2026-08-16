"""RaceIQ analysis engine entry point.

``run_analysis`` loads one FastF1 race session, computes the four
verified RaceIQ metrics, and returns the versioned analysis contract
defined in schemas.py. It never raises for a single unavailable
metric: metric-level failures are recorded in ``warnings`` and the
corresponding list is returned empty, matching the "must not crash the
whole analysis when one metric is unavailable" requirement.

It does raise for a genuinely invalid selection (``availability.
SelectionError``) and for a session that fails to load entirely.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from raceiq import metrics, narrative
from raceiq.availability import season_availability, validate_selection
from raceiq.schemas import ANALYSIS_VERSION

TOP_DRIVER_COUNT = 5
DEGRADATION_SAMPLE = 5

METHODOLOGY = {
    "quickLapDefinition": (
        "A quick lap is any lap under 107% of the fastest single lap time "
        "recorded by any driver in the session (FastF1 pick_quicklaps() default). "
        "This excludes in/out laps and most pit-affected laps, but does not "
        "explicitly detect safety car or virtual safety car periods."
    ),
    "averagePace": "Mean lap time across a driver's quick laps, ranked fastest to slowest.",
    "consistency": "Standard deviation of lap time across a driver's quick laps; lower is steadier.",
    "degradation": (
        "Heuristic comparison of the mean of a driver's first N quick laps "
        "against the mean of their last N quick laps (N=5 by default, reduced "
        "for drivers with fewer quick laps). Not a stint-aware tire model."
    ),
    "topDriverSelection": (
        f"Lap-trend and degradation views are limited to the top "
        f"{TOP_DRIVER_COUNT} drivers by average quick-lap pace."
    ),
}


def _load_session(year: int, event: str, session_code: str, cache_dir: str):
    import fastf1

    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
    session = fastf1.get_session(year, event, session_code)
    session.load()
    return session


def _driver_info(session: Any, driver_code: str, warnings: list[str]) -> dict[str, Any]:
    try:
        info = session.get_driver(driver_code)
        return {
            "code": driver_code,
            "fullName": info.get("FullName") or driver_code,
            "team": info.get("TeamName"),
        }
    except Exception:  # noqa: BLE001 - deliberately tolerant, see module docstring
        warnings.append(f"driver metadata unavailable for {driver_code}")
        return {"code": driver_code, "fullName": driver_code, "team": None}


def run_analysis(
    year: int,
    event: str,
    session_code: str = "R",
    cache_dir: str = "cache",
) -> dict[str, Any]:
    validate_selection(year, event, session_code)
    availability = season_availability(year)
    generated_at = datetime.now(timezone.utc).isoformat()

    base_payload: dict[str, Any] = {
        "analysisVersion": ANALYSIS_VERSION,
        "generatedAt": generated_at,
        "dataSource": "generated",
        "event": {
            "year": year,
            "round": None,
            "name": event,
            "session": session_code,
            "date": None,
            "circuit": None,
        },
        "availability": {k: availability[k] for k in ("lapTiming", "telemetry", "tireCompounds", "weather")},
        "summary": {
            "fastestAveragePaceDriver": None,
            "mostConsistentDriver": None,
            "strongestLateRaceDriver": None,
            "largestPaceDeclineDriver": None,
        },
        "evidence": [],
        "drivers": [],
        "paceRanking": [],
        "lapTrends": [],
        "consistency": [],
        "degradation": [],
        "methodology": METHODOLOGY,
        "warnings": [],
    }

    if not availability["lapTiming"]:
        base_payload["warnings"].append(
            f"Lap timing is not available for {year}. RaceIQ's pace, consistency, "
            "and degradation views require FastF1 lap timing data, which is only "
            "documented from the 2018 season onward. See docs/DATA_AVAILABILITY.md."
        )
        return base_payload

    session = _load_session(year, event, session_code, cache_dir)

    event_info = base_payload["event"]
    try:
        event_info["round"] = int(session.event["RoundNumber"])
        event_info["name"] = str(session.event["EventName"])
        event_info["circuit"] = str(session.event["Location"])
        event_info["date"] = str(session.date) if session.date is not None else None
    except Exception:  # noqa: BLE001
        base_payload["warnings"].append("event metadata partially unavailable from session data")

    quick_laps = session.laps.pick_quicklaps()

    warnings = base_payload["warnings"]

    pace_ranking: list[dict[str, Any]] = []
    try:
        pace_ranking = metrics.average_pace(quick_laps)
        base_payload["paceRanking"] = pace_ranking
    except metrics.MetricError as exc:
        warnings.append(f"average pace unavailable: {exc}")

    top_drivers = [row["driver"] for row in pace_ranking[:TOP_DRIVER_COUNT]]

    if top_drivers:
        try:
            base_payload["lapTrends"] = metrics.lap_trends(quick_laps, top_drivers)
        except metrics.MetricError as exc:
            warnings.append(f"lap trends unavailable: {exc}")

        try:
            base_payload["degradation"] = metrics.degradation(
                quick_laps, top_drivers, sample_size=DEGRADATION_SAMPLE
            )
        except metrics.MetricError as exc:
            warnings.append(f"degradation unavailable: {exc}")
    else:
        warnings.append("no top drivers identified; lap trends and degradation skipped")

    try:
        base_payload["consistency"] = metrics.consistency(quick_laps)
    except metrics.MetricError as exc:
        warnings.append(f"consistency unavailable: {exc}")

    all_drivers = sorted(quick_laps["Driver"].unique().tolist())
    base_payload["drivers"] = [_driver_info(session, code, warnings) for code in all_drivers]

    narrative_result = narrative.build_summary(
        pace_ranking=base_payload["paceRanking"],
        consistency_ranking=base_payload["consistency"],
        degradation_ranking=base_payload["degradation"],
        warnings=warnings,
    )
    base_payload["summary"] = narrative_result["summary"]
    base_payload["evidence"] = narrative_result["evidence"]

    return base_payload
