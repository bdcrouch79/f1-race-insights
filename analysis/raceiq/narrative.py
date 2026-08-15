"""Deterministic, template-based RaceIQ summary generation.

No LLM or generative text model is used. Every claim in the summary is
derived directly from the already-computed metric tables and is
traceable back to a metric name, driver, value, sample size, and
methodology note via the ``evidence`` list.
"""

from __future__ import annotations

from typing import Any


def build_summary(
    pace_ranking: list[dict[str, Any]],
    consistency_ranking: list[dict[str, Any]],
    degradation_ranking: list[dict[str, Any]],
    warnings: list[str],
) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "fastestAveragePaceDriver": None,
        "mostConsistentDriver": None,
        "strongestLateRaceDriver": None,
        "largestPaceDeclineDriver": None,
    }
    evidence: list[dict[str, Any]] = []

    if pace_ranking:
        leader = pace_ranking[0]
        summary["fastestAveragePaceDriver"] = leader["driver"]
        evidence.append(
            {
                "metric": "averagePace",
                "driver": leader["driver"],
                "value": leader["averageLapTimeSeconds"],
                "unit": "seconds",
                "sampleSize": leader["sampleSize"],
                "methodology": (
                    "Mean lap time across FastF1 quick laps "
                    "(laps under 107% of the session's fastest lap)."
                ),
            }
        )

    if consistency_ranking:
        steadiest = consistency_ranking[0]
        summary["mostConsistentDriver"] = steadiest["driver"]
        evidence.append(
            {
                "metric": "consistency",
                "driver": steadiest["driver"],
                "value": steadiest["stdDevSeconds"],
                "unit": "seconds (standard deviation)",
                "sampleSize": steadiest["sampleSize"],
                "methodology": "Standard deviation of lap time across quick laps; lower is steadier.",
            }
        )

    if degradation_ranking:
        strongest_closer = min(degradation_ranking, key=lambda row: row["deltaSeconds"])
        summary["strongestLateRaceDriver"] = strongest_closer["driver"]
        evidence.append(
            {
                "metric": "degradation",
                "driver": strongest_closer["driver"],
                "value": strongest_closer["deltaSeconds"],
                "unit": "seconds",
                "sampleSize": strongest_closer["sampleSize"],
                "methodology": (
                    "Closing-average minus opening-average quick-lap time "
                    "over the first/last sampled quick laps; heuristic, not a stint-aware tire model."
                ),
            }
        )

        largest_decline = max(degradation_ranking, key=lambda row: row["deltaSeconds"])
        summary["largestPaceDeclineDriver"] = largest_decline["driver"]
        evidence.append(
            {
                "metric": "degradation",
                "driver": largest_decline["driver"],
                "value": largest_decline["deltaSeconds"],
                "unit": "seconds",
                "sampleSize": largest_decline["sampleSize"],
                "methodology": (
                    "Closing-average minus opening-average quick-lap time "
                    "over the first/last sampled quick laps; heuristic, not a stint-aware tire model."
                ),
            }
        )

    return {"summary": summary, "evidence": evidence}
