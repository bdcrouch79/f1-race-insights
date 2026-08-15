"""Deterministic metric calculations over a FastF1 quick-laps table.

Every function here takes a pandas DataFrame shaped like FastF1's
``Laps`` table (at minimum the columns ``Driver``, ``LapNumber``, and
``LapTime`` as a timedelta) and returns plain Python data structures
ready for JSON serialization. Calculations are intentionally unchanged
from the original ``main.py`` script; this module only separates them
from chart rendering and makes them independently testable.

"Quick laps" means laps under FastF1's ``pick_quicklaps()`` default
threshold: any lap faster than 107% of the fastest single lap time
recorded by any driver in the session. This excludes in/out laps and
most laps disrupted by pit stops or incidents, but it does not
explicitly detect safety car or virtual safety car periods.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


class MetricError(RuntimeError):
    """Raised when a metric cannot be computed from the given laps."""


def _require_laps(laps: Any, min_drivers: int = 1) -> None:
    if laps is None or len(laps) == 0:
        raise MetricError("no quick laps available to compute this metric")
    drivers = laps["Driver"].unique()
    if len(drivers) < min_drivers:
        raise MetricError("not enough drivers with quick laps for this metric")


def average_pace(laps: Any) -> list[dict[str, Any]]:
    """Average representative race pace per driver, fastest first.

    Sample size is the number of quick laps used for that driver's
    average. Gap-to-fastest is relative to the fastest average among
    the computed drivers, not the single fastest lap of the race.
    """
    _require_laps(laps)

    grouped = laps.groupby("Driver")["LapTime"]
    means = grouped.mean().dropna().sort_values()
    counts = grouped.count()

    if means.empty:
        raise MetricError("no driver had a valid average lap time")

    fastest_seconds = means.iloc[0].total_seconds()

    ranking: list[dict[str, Any]] = []
    for position, (driver, mean_time) in enumerate(means.items(), start=1):
        avg_seconds = mean_time.total_seconds()
        ranking.append(
            {
                "driver": driver,
                "rank": position,
                "averageLapTimeSeconds": round(avg_seconds, 3),
                "gapToFastestSeconds": round(avg_seconds - fastest_seconds, 3),
                "sampleSize": int(counts.loc[driver]),
            }
        )
    return ranking


def lap_trends(laps: Any, drivers: list[str]) -> list[dict[str, Any]]:
    """Lap-by-lap quick-lap times for the given drivers.

    Missing or filtered-out laps (pit laps, safety car laps, laps over
    the quick-lap threshold) are simply absent from a driver's series
    rather than interpolated, so gaps in lap number are expected and
    must be handled by the frontend as missing data, not zero pace.
    """
    _require_laps(laps)

    series: list[dict[str, Any]] = []
    for driver in drivers:
        driver_laps = laps[laps["Driver"] == driver].sort_values("LapNumber")
        points = [
            {
                "lapNumber": int(row["LapNumber"]),
                "lapTimeSeconds": round(row["LapTime"].total_seconds(), 3),
            }
            for _, row in driver_laps.iterrows()
            if pd.notna(row["LapTime"])
        ]
        series.append({"driver": driver, "sampleSize": len(points), "laps": points})
    return series


def consistency(laps: Any) -> list[dict[str, Any]]:
    """Lap-time standard deviation per driver, most consistent first.

    Lower standard deviation indicates a more stable lap-time profile
    across quick laps. A driver needs at least two quick laps for a
    standard deviation to be defined.
    """
    _require_laps(laps)

    grouped = laps.groupby("Driver")["LapTime"]
    counts = grouped.count()
    stds = grouped.std().dropna().sort_values()

    if stds.empty:
        raise MetricError("no driver had enough quick laps for a standard deviation")

    ranking: list[dict[str, Any]] = []
    for position, (driver, std_time) in enumerate(stds.items(), start=1):
        ranking.append(
            {
                "driver": driver,
                "rank": position,
                "stdDevSeconds": round(std_time.total_seconds(), 3),
                "sampleSize": int(counts.loc[driver]),
            }
        )
    return ranking


def degradation(laps: Any, drivers: list[str], sample_size: int = 5) -> list[dict[str, Any]]:
    """Opening-vs-closing quick-lap pace heuristic for the given drivers.

    This is a heuristic, not a stint-aware tire model: it compares the
    mean of each driver's first ``sample_size`` quick laps to the mean
    of their last ``sample_size`` quick laps. A positive
    ``deltaSeconds`` means the driver was slower at the end of their
    sampled quick laps than at the start. Safety cars, traffic, pit
    strategy, and stint boundaries are not accounted for.
    """
    _require_laps(laps)

    results: list[dict[str, Any]] = []
    for driver in drivers:
        driver_laps = laps[laps["Driver"] == driver].sort_values("LapNumber")
        lap_times = driver_laps["LapTime"].dropna()

        if len(lap_times) < 2:
            continue

        effective_sample = min(sample_size, len(lap_times) // 2) or 1
        opening = lap_times.head(effective_sample)
        closing = lap_times.tail(effective_sample)

        opening_avg = opening.mean().total_seconds()
        closing_avg = closing.mean().total_seconds()

        results.append(
            {
                "driver": driver,
                "openingAverageSeconds": round(opening_avg, 3),
                "closingAverageSeconds": round(closing_avg, 3),
                "deltaSeconds": round(closing_avg - opening_avg, 3),
                "sampleSize": effective_sample,
                "totalQuickLaps": int(len(lap_times)),
                "heuristic": True,
            }
        )
    return results
