from __future__ import annotations

import math

import pandas as pd
import pytest

from raceiq import metrics


def test_average_pace_ranks_fastest_first(synthetic_quick_laps):
    ranking = metrics.average_pace(synthetic_quick_laps)
    drivers = [row["driver"] for row in ranking]

    assert drivers == ["AAA", "BBB", "CCC"]
    assert ranking[0]["averageLapTimeSeconds"] == pytest.approx(90.45)
    assert ranking[0]["gapToFastestSeconds"] == 0
    assert ranking[1]["averageLapTimeSeconds"] == pytest.approx(91.0)
    assert ranking[1]["gapToFastestSeconds"] == pytest.approx(0.55)
    assert ranking[2]["sampleSize"] == 10


def test_average_pace_requires_laps():
    with pytest.raises(metrics.MetricError):
        metrics.average_pace(pd.DataFrame({"Driver": [], "LapTime": []}))


def test_consistency_ranks_flattest_first(synthetic_quick_laps):
    ranking = metrics.consistency(synthetic_quick_laps)
    by_driver = {row["driver"]: row for row in ranking}

    assert ranking[0]["driver"] == "BBB"
    assert by_driver["BBB"]["stdDevSeconds"] == 0
    assert by_driver["AAA"]["stdDevSeconds"] == pytest.approx(0.303, abs=0.001)
    assert by_driver["CCC"]["stdDevSeconds"] == pytest.approx(0.303, abs=0.001)


def test_consistency_skips_single_lap_drivers(single_lap_driver):
    with pytest.raises(metrics.MetricError):
        metrics.consistency(single_lap_driver)


def test_lap_trends_returns_ordered_series(synthetic_quick_laps):
    trends = metrics.lap_trends(synthetic_quick_laps, ["AAA", "BBB"])
    by_driver = {row["driver"]: row for row in trends}

    assert [p["lapNumber"] for p in by_driver["AAA"]["laps"]] == list(range(1, 11))
    assert by_driver["AAA"]["laps"][0]["lapTimeSeconds"] == pytest.approx(90.0)
    assert by_driver["AAA"]["sampleSize"] == 10


def test_degradation_heuristic_matches_hand_calculation(synthetic_quick_laps):
    results = metrics.degradation(synthetic_quick_laps, ["AAA", "BBB", "CCC"], sample_size=5)
    by_driver = {row["driver"]: row for row in results}

    assert by_driver["AAA"]["openingAverageSeconds"] == pytest.approx(90.2)
    assert by_driver["AAA"]["closingAverageSeconds"] == pytest.approx(90.7)
    assert by_driver["AAA"]["deltaSeconds"] == pytest.approx(0.5)
    assert by_driver["AAA"]["heuristic"] is True

    assert by_driver["BBB"]["deltaSeconds"] == pytest.approx(0.0)

    assert by_driver["CCC"]["openingAverageSeconds"] == pytest.approx(91.8)
    assert by_driver["CCC"]["closingAverageSeconds"] == pytest.approx(91.3)
    assert by_driver["CCC"]["deltaSeconds"] == pytest.approx(-0.5)

    strongest_closer = min(results, key=lambda r: r["deltaSeconds"])
    largest_decline = max(results, key=lambda r: r["deltaSeconds"])
    assert strongest_closer["driver"] == "CCC"
    assert largest_decline["driver"] == "AAA"


def test_degradation_skips_drivers_with_fewer_than_two_laps(single_lap_driver):
    results = metrics.degradation(single_lap_driver, ["DDD"], sample_size=5)
    assert results == []


def test_degradation_shrinks_sample_for_short_stints():
    rows = [
        {"Driver": "EEE", "LapNumber": lap, "LapTimeSeconds": 80.0 + lap}
        for lap in range(1, 5)  # only 4 quick laps
    ]
    frame = pd.DataFrame(rows)
    frame["LapTime"] = pd.to_timedelta(frame["LapTimeSeconds"], unit="s")

    results = metrics.degradation(frame, ["EEE"], sample_size=5)

    assert len(results) == 1
    assert results[0]["sampleSize"] == 2
    assert not math.isnan(results[0]["deltaSeconds"])
