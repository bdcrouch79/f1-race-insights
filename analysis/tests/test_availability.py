from __future__ import annotations

import pytest

from raceiq import availability


def test_2018_and_later_has_full_coverage():
    result = availability.season_availability(2018)
    assert result == {
        "year": 2018,
        "schedule": True,
        "results": True,
        "lapTiming": True,
        "telemetry": True,
        "tireCompounds": True,
        "weather": True,
    }


def test_pre_2018_has_no_lap_level_coverage():
    result = availability.season_availability(2005)
    assert result["schedule"] is True
    assert result["results"] is True
    assert result["lapTiming"] is False
    assert result["telemetry"] is False
    assert result["tireCompounds"] is False
    assert result["weather"] is False


def test_validate_selection_rejects_unsupported_session():
    with pytest.raises(availability.SelectionError):
        availability.validate_selection(2024, "Monaco", "Q")


def test_validate_selection_rejects_out_of_range_year():
    with pytest.raises(availability.SelectionError):
        availability.validate_selection(1930, "Monaco", "R")


def test_validate_selection_allows_pre_2018_year():
    # Not a validation failure -- the engine handles this as a
    # documented "lap timing unavailable" case, not an invalid request.
    availability.validate_selection(2005, "Monaco", "R")
