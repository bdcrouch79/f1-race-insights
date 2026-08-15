"""Verified historical data-coverage rules for the RaceIQ engine.

RaceIQ's four analysis views (average pace, lap trends, consistency,
degradation) all depend on lap-by-lap timing data. FastF1's own
documentation states that timing data, car telemetry, and position data
are available starting with the 2018 season; earlier seasons are only
covered by schedule and classification data through the Ergast-derived
results API, with no lap-by-lap timing.

See docs/DATA_AVAILABILITY.md for the full coverage matrix and sourcing.
Do not change LAP_TIMING_MIN_SEASON without re-verifying it against
FastF1's current documentation.
"""

from __future__ import annotations

from datetime import date
from typing import TypedDict

# First season FastF1 documents reliable lap timing / telemetry / car
# data for. Verified against FastF1's official documentation and GitHub
# repository description (theOehrly/Fast-F1) on 2026-08-15.
LAP_TIMING_MIN_SEASON = 2018

# Schedule and classification data (via Ergast-derived sources) reach
# back much further, but RaceIQ does not currently build any analysis
# view from schedule/classification data alone.
SCHEDULE_MIN_SEASON = 1950

# RaceIQ Phase 1 only implements the Race session. Qualifying, sprint,
# and practice sessions are schema-compatible but not yet wired into
# the engine or the frontend selector.
SUPPORTED_SESSIONS = {"R": "Race"}


class SeasonAvailability(TypedDict):
    year: int
    schedule: bool
    results: bool
    lapTiming: bool
    telemetry: bool
    tireCompounds: bool
    weather: bool


def current_max_season() -> int:
    """Latest season RaceIQ will attempt to analyze: the current year."""
    return date.today().year


def season_availability(year: int) -> SeasonAvailability:
    """Return verified, metric-level data availability for a season.

    This does not guarantee that a specific session actually loads
    successfully (a session can still fail or be incomplete within a
    supported season), only that the season is within FastF1's
    documented coverage for that data category.
    """
    lap_timing = year >= LAP_TIMING_MIN_SEASON
    return {
        "year": year,
        "schedule": year >= SCHEDULE_MIN_SEASON,
        "results": year >= SCHEDULE_MIN_SEASON,
        "lapTiming": lap_timing,
        # Telemetry, tire compounds, and weather are all delivered
        # through the same 2018+ timing data pipeline as lap timing.
        "telemetry": lap_timing,
        "tireCompounds": lap_timing,
        "weather": lap_timing,
    }


class SelectionError(ValueError):
    """Raised when a requested year/event/session cannot be validated."""


def validate_selection(year: int, event: str, session: str) -> None:
    """Validate a requested analysis selection before loading any data.

    Raises SelectionError with a human-readable reason. Does not raise
    for seasons before LAP_TIMING_MIN_SEASON -- that is a supported,
    documented "unavailable metrics" case handled by the engine, not a
    validation failure.
    """
    if not isinstance(year, int):
        raise SelectionError("year must be an integer")
    if year < SCHEDULE_MIN_SEASON or year > current_max_season():
        raise SelectionError(
            f"year {year} is outside RaceIQ's supported range "
            f"({SCHEDULE_MIN_SEASON}-{current_max_season()})"
        )
    if not event or not isinstance(event, str):
        raise SelectionError("event must be a non-empty string")
    if session not in SUPPORTED_SESSIONS:
        supported = ", ".join(SUPPORTED_SESSIONS)
        raise SelectionError(
            f"session '{session}' is not supported in Phase 1 "
            f"(supported: {supported})"
        )
