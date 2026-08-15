"""Integration test: engine output against a fixture session, validated
against the frontend-facing schema contract, with no live network
request. This is RaceIQ's "one known race fixture" integration test.
"""

from __future__ import annotations

import fastf1
import pandas as pd
import pytest

from raceiq import engine
from raceiq.schemas import validate_analysis


class _FakeSession:
    def __init__(self, laps: pd.DataFrame):
        self._laps = fastf1.core.Laps(laps)
        self.event = {"RoundNumber": 8, "EventName": "Fixture Grand Prix", "Location": "Fixture Circuit"}
        self.date = "2024-05-26"

    def load(self):
        pass

    @property
    def laps(self):
        return self._laps

    def get_driver(self, code: str):
        return {"FullName": f"Driver {code}", "TeamName": "Fixture Team"}


def _fixture_laps() -> pd.DataFrame:
    rows: list[dict] = []
    for lap in range(1, 11):
        rows.append({"Driver": "AAA", "LapNumber": lap, "LapTimeSeconds": 90.0 + (lap - 1) * 0.1})
    for lap in range(1, 11):
        rows.append({"Driver": "BBB", "LapNumber": lap, "LapTimeSeconds": 91.0})
    for lap in range(1, 11):
        rows.append({"Driver": "CCC", "LapNumber": lap, "LapTimeSeconds": 92.0 - (lap - 1) * 0.1})
    frame = pd.DataFrame(rows)
    frame["LapTime"] = pd.to_timedelta(frame["LapTimeSeconds"], unit="s")
    return frame.drop(columns=["LapTimeSeconds"])


@pytest.fixture
def patched_fastf1(monkeypatch):
    fake_session = _FakeSession(_fixture_laps())
    monkeypatch.setattr(fastf1.Cache, "enable_cache", lambda *a, **k: None)
    monkeypatch.setattr(fastf1, "get_session", lambda *a, **k: fake_session)
    return fake_session


def test_run_analysis_matches_schema_and_expected_values(patched_fastf1):
    result = engine.run_analysis(2024, "Fixture", "R")

    validate_analysis(result)

    assert result["dataSource"] == "generated"
    assert result["event"]["name"] == "Fixture Grand Prix"
    assert result["event"]["round"] == 8
    assert result["availability"]["lapTiming"] is True

    assert result["summary"]["fastestAveragePaceDriver"] == "AAA"
    assert result["summary"]["mostConsistentDriver"] == "BBB"
    assert result["summary"]["strongestLateRaceDriver"] == "CCC"
    assert result["summary"]["largestPaceDeclineDriver"] == "AAA"

    assert len(result["evidence"]) == 4
    for item in result["evidence"]:
        assert {"metric", "driver", "value", "sampleSize", "methodology"} <= item.keys()

    assert result["warnings"] == []


def test_run_analysis_is_deterministic_across_runs(patched_fastf1):
    first = engine.run_analysis(2024, "Fixture", "R")
    second = engine.run_analysis(2024, "Fixture", "R")

    first.pop("generatedAt")
    second.pop("generatedAt")
    assert first == second


def test_run_analysis_pre_2018_returns_documented_unavailable_state():
    result = engine.run_analysis(2005, "Fixture", "R")

    validate_analysis(result)
    assert result["availability"]["lapTiming"] is False
    assert result["paceRanking"] == []
    assert any("2005" in w for w in result["warnings"])


def test_run_analysis_rejects_unsupported_session():
    from raceiq.availability import SelectionError

    with pytest.raises(SelectionError):
        engine.run_analysis(2024, "Fixture", "Q")
