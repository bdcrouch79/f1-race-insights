"""The RaceIQ analysis contract: the versioned shape returned by
``raceiq.engine.run_analysis`` and consumed by the Next.js frontend.

Bump ANALYSIS_VERSION whenever a change to this module, metrics.py, or
narrative.py would change the meaning of already-generated output.
Cache keys and generated file paths are namespaced by this version
(see docs/METHODOLOGY.md and docs/ARCHITECTURE.md), so a version bump
is what triggers regeneration rather than silently reinterpreting old
files.
"""

from __future__ import annotations

from typing import Any

ANALYSIS_VERSION = "1.0.0"

REQUIRED_TOP_LEVEL_KEYS = {
    "analysisVersion",
    "generatedAt",
    "dataSource",
    "event",
    "availability",
    "summary",
    "evidence",
    "drivers",
    "paceRanking",
    "lapTrends",
    "consistency",
    "degradation",
    "methodology",
    "warnings",
}

REQUIRED_EVENT_KEYS = {"year", "round", "name", "session", "date", "circuit"}

REQUIRED_AVAILABILITY_KEYS = {"lapTiming", "telemetry", "tireCompounds", "weather"}

VALID_DATA_SOURCES = {"generated", "cached", "demo-fixture"}


class SchemaError(ValueError):
    """Raised when an analysis payload does not satisfy the contract."""


def validate_analysis(payload: dict[str, Any]) -> None:
    """Validate that ``payload`` satisfies the RaceIQ analysis contract.

    This is a structural contract check, not a business-rule check: it
    exists so the frontend can trust the shape of any generated JSON
    file, and so a failed generation run fails loudly instead of
    shipping a malformed artifact.
    """
    missing = REQUIRED_TOP_LEVEL_KEYS - payload.keys()
    if missing:
        raise SchemaError(f"analysis payload missing top-level keys: {sorted(missing)}")

    if payload["analysisVersion"] != ANALYSIS_VERSION:
        raise SchemaError(
            f"analysisVersion {payload['analysisVersion']!r} does not match "
            f"engine ANALYSIS_VERSION {ANALYSIS_VERSION!r}"
        )

    if payload["dataSource"] not in VALID_DATA_SOURCES:
        raise SchemaError(
            f"dataSource {payload['dataSource']!r} must be one of {sorted(VALID_DATA_SOURCES)}"
        )

    event = payload.get("event")
    if not isinstance(event, dict) or (REQUIRED_EVENT_KEYS - event.keys()):
        raise SchemaError(f"event must contain keys: {sorted(REQUIRED_EVENT_KEYS)}")

    availability = payload.get("availability")
    if not isinstance(availability, dict) or (REQUIRED_AVAILABILITY_KEYS - availability.keys()):
        raise SchemaError(f"availability must contain keys: {sorted(REQUIRED_AVAILABILITY_KEYS)}")

    for list_field in ("evidence", "drivers", "paceRanking", "lapTrends", "consistency", "degradation", "warnings"):
        if not isinstance(payload.get(list_field), list):
            raise SchemaError(f"{list_field} must be a list")

    if not isinstance(payload.get("methodology"), dict):
        raise SchemaError("methodology must be an object")
