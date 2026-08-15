from __future__ import annotations

import copy

import pytest

from raceiq.schemas import ANALYSIS_VERSION, SchemaError, validate_analysis

MINIMAL_VALID_PAYLOAD = {
    "analysisVersion": ANALYSIS_VERSION,
    "generatedAt": "2026-08-15T00:00:00+00:00",
    "dataSource": "generated",
    "event": {
        "year": 2024,
        "round": 8,
        "name": "Example Grand Prix",
        "session": "R",
        "date": "2024-05-26",
        "circuit": "Example Circuit",
    },
    "availability": {
        "lapTiming": True,
        "telemetry": True,
        "tireCompounds": True,
        "weather": True,
    },
    "summary": {},
    "evidence": [],
    "drivers": [],
    "paceRanking": [],
    "lapTrends": [],
    "consistency": [],
    "degradation": [],
    "methodology": {},
    "warnings": [],
}


def test_minimal_valid_payload_passes():
    validate_analysis(MINIMAL_VALID_PAYLOAD)


def test_missing_top_level_key_fails():
    payload = copy.deepcopy(MINIMAL_VALID_PAYLOAD)
    del payload["paceRanking"]
    with pytest.raises(SchemaError):
        validate_analysis(payload)


def test_version_mismatch_fails():
    payload = copy.deepcopy(MINIMAL_VALID_PAYLOAD)
    payload["analysisVersion"] = "0.0.1"
    with pytest.raises(SchemaError):
        validate_analysis(payload)


def test_invalid_data_source_fails():
    payload = copy.deepcopy(MINIMAL_VALID_PAYLOAD)
    payload["dataSource"] = "made-up"
    with pytest.raises(SchemaError):
        validate_analysis(payload)


def test_incomplete_event_fails():
    payload = copy.deepcopy(MINIMAL_VALID_PAYLOAD)
    del payload["event"]["circuit"]
    with pytest.raises(SchemaError):
        validate_analysis(payload)
