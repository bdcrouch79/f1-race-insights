"""Tests for the headline-eligibility fix.

A driver with very few quick laps relative to the field (typically an
early retirement) can post the best raw average pace or the smallest
degradation delta on a handful of clean laps before their incident.
Real data surfaced exactly this on first use: Monaco 2024's Logan
Sargeant (14 quick laps, field high ~50) topped the raw average-pace
and degradation-decline rankings. These tests fix that with synthetic
data mirroring the same shape.
"""

from __future__ import annotations

from raceiq import narrative


def _pace_row(driver: str, avg: float, sample: int) -> dict:
    return {"driver": driver, "rank": 0, "averageLapTimeSeconds": avg, "gapToFastestSeconds": 0.0, "sampleSize": sample}


def _consistency_row(driver: str, std: float, sample: int) -> dict:
    return {"driver": driver, "rank": 0, "stdDevSeconds": std, "sampleSize": sample}


def _degradation_row(driver: str, delta: float, total_quick_laps: int) -> dict:
    return {
        "driver": driver,
        "openingAverageSeconds": 90.0,
        "closingAverageSeconds": 90.0 + delta,
        "deltaSeconds": delta,
        "sampleSize": min(5, total_quick_laps),
        "totalQuickLaps": total_quick_laps,
        "heuristic": True,
    }


def test_low_sample_driver_excluded_from_pace_headline():
    # EARLY (few clean laps before retiring) has the best raw average but
    # only 14 laps against a field high of 50 -- below the 50% threshold.
    pace_ranking = [
        _pace_row("EARLY", 76.2, 14),
        _pace_row("FULL1", 77.0, 50),
        _pace_row("FULL2", 77.4, 49),
    ]

    result = narrative.build_summary(pace_ranking, [], [], warnings := [])

    assert result["summary"]["fastestAveragePaceDriver"] == "FULL1"
    assert any("EARLY" in w for w in warnings)


def test_low_sample_driver_excluded_from_consistency_headline():
    consistency_ranking = [
        _consistency_row("EARLY", 0.05, 14),
        _consistency_row("FULL1", 0.30, 50),
        _consistency_row("FULL2", 0.35, 49),
    ]

    result = narrative.build_summary([], consistency_ranking, [], warnings := [])

    assert result["summary"]["mostConsistentDriver"] == "FULL1"
    assert any("EARLY" in w for w in warnings)


def test_low_sample_driver_excluded_from_degradation_headlines():
    degradation_ranking = [
        _degradation_row("EARLY", 1.5, 14),  # would otherwise be "largest decline"
        _degradation_row("FULL1", 0.5, 50),
        _degradation_row("FULL2", -0.5, 49),  # should win "strongest closing pace"
    ]

    result = narrative.build_summary([], [], degradation_ranking, warnings := [])

    assert result["summary"]["strongestLateRaceDriver"] == "FULL2"
    assert result["summary"]["largestPaceDeclineDriver"] == "FULL1"
    assert any("EARLY" in w for w in warnings)


def test_full_field_headline_unaffected_when_samples_are_comparable():
    pace_ranking = [_pace_row("A", 76.0, 48), _pace_row("B", 77.0, 50)]

    result = narrative.build_summary(pace_ranking, [], [], warnings := [])

    assert result["summary"]["fastestAveragePaceDriver"] == "A"
    assert warnings == []


def test_falls_back_to_full_field_when_everyone_has_a_short_race():
    # A red-flagged/short session: everyone has a low sample, but the
    # filter must not empty out and produce no headline at all.
    pace_ranking = [_pace_row("A", 76.0, 4), _pace_row("B", 77.0, 3)]

    result = narrative.build_summary(pace_ranking, [], [], [])

    assert result["summary"]["fastestAveragePaceDriver"] == "A"


def test_evidence_still_traces_to_metric_driver_value_sample_and_methodology():
    pace_ranking = [_pace_row("A", 76.0, 48)]
    result = narrative.build_summary(pace_ranking, [], [], [])

    assert len(result["evidence"]) == 1
    item = result["evidence"][0]
    assert {"metric", "driver", "value", "unit", "sampleSize", "methodology"} <= item.keys()
    assert item["driver"] == "A"
    assert item["sampleSize"] == 48
