"""Shared deterministic test fixtures.

All driver identifiers here (AAA, BBB, CCC, DDD) are synthetic
placeholders invented for these tests. They are not real FastF1 driver
codes and no output derived from them should ever be presented as a
real race result. See docs/DATA_AVAILABILITY.md and
docs/METHODOLOGY.md for how real analyses are generated.
"""

from __future__ import annotations

import pandas as pd
import pytest


def _laps(rows: list[dict]) -> pd.DataFrame:
    frame = pd.DataFrame(rows)
    frame["LapTime"] = pd.to_timedelta(frame["LapTimeSeconds"], unit="s")
    return frame.drop(columns=["LapTimeSeconds"])


@pytest.fixture
def synthetic_quick_laps() -> pd.DataFrame:
    """Ten quick laps each for three synthetic drivers.

    AAA: fastest on average (90.0-90.9s) but fades late (positive delta).
    BBB: perfectly flat pace (std dev == 0, delta == 0).
    CCC: slowest on average (91.1-92.0s) but improves late (negative delta).
    """
    rows: list[dict] = []

    for lap in range(1, 11):
        rows.append(
            {"Driver": "AAA", "LapNumber": lap, "LapTimeSeconds": 90.0 + (lap - 1) * 0.1}
        )
    for lap in range(1, 11):
        rows.append({"Driver": "BBB", "LapNumber": lap, "LapTimeSeconds": 91.0})
    for lap in range(1, 11):
        rows.append(
            {"Driver": "CCC", "LapNumber": lap, "LapTimeSeconds": 92.0 - (lap - 1) * 0.1}
        )

    return _laps(rows)


@pytest.fixture
def single_lap_driver() -> pd.DataFrame:
    """A driver (DDD) with only one quick lap: too few for std dev or degradation."""
    return _laps([{"Driver": "DDD", "LapNumber": 1, "LapTimeSeconds": 95.0}])
