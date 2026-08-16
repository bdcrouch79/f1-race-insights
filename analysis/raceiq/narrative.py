"""Deterministic, template-based RaceIQ summary generation.

No LLM or generative text model is used. Every claim in the summary is
derived directly from the already-computed metric tables and is
traceable back to a metric name, driver, value, sample size, and
methodology note via the ``evidence`` list.

Headline eligibility: a driver with very few quick laps relative to the
rest of the field (typically because they retired early) can dominate
a raw average-pace or degradation ranking on a handful of clean laps
before their incident, in a way that misrepresents their actual race.
Headline picks (the four ``summary`` fields and their evidence) are
therefore restricted to drivers with a quick-lap sample at or above
``MIN_HEADLINE_SAMPLE_RATIO`` of the field's largest sample. The full,
unfiltered rankings (``paceRanking``, ``consistency``, ``degradation``)
are unaffected -- every driver still appears there with their real
sample size.
"""

from __future__ import annotations

from typing import Any

MIN_HEADLINE_SAMPLE_RATIO = 0.5


def _eligible_for_headline(rows: list[dict[str, Any]], sample_key: str) -> list[dict[str, Any]]:
    """Rows with a quick-lap sample at least half the field's largest.

    Falls back to the full, unfiltered list if the filter would exclude
    every row (e.g. every driver had a short, disrupted race) so a
    headline is still produced rather than silently omitted.
    """
    if not rows:
        return rows
    typical = max(row[sample_key] for row in rows)
    threshold = typical * MIN_HEADLINE_SAMPLE_RATIO
    eligible = [row for row in rows if row[sample_key] >= threshold]
    return eligible or rows


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

    eligible_pace = _eligible_for_headline(pace_ranking, "sampleSize")
    if eligible_pace:
        leader = eligible_pace[0]
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
                    "(laps under 107% of the session's fastest lap). "
                    "Headline picks require a quick-lap sample at least half the field's largest."
                ),
            }
        )
        if leader is not pace_ranking[0]:
            warnings.append(
                f"{pace_ranking[0]['driver']} had the fastest raw average pace but only "
                f"{pace_ranking[0]['sampleSize']} quick laps and was excluded from the headline "
                "pick as an unrepresentative sample."
            )

    eligible_consistency = _eligible_for_headline(consistency_ranking, "sampleSize")
    if eligible_consistency:
        steadiest = eligible_consistency[0]
        summary["mostConsistentDriver"] = steadiest["driver"]
        evidence.append(
            {
                "metric": "consistency",
                "driver": steadiest["driver"],
                "value": steadiest["stdDevSeconds"],
                "unit": "seconds (standard deviation)",
                "sampleSize": steadiest["sampleSize"],
                "methodology": (
                    "Standard deviation of lap time across quick laps; lower is steadier. "
                    "Headline picks require a quick-lap sample at least half the field's largest."
                ),
            }
        )
        if steadiest is not consistency_ranking[0]:
            warnings.append(
                f"{consistency_ranking[0]['driver']} had the lowest raw lap-time variance but only "
                f"{consistency_ranking[0]['sampleSize']} quick laps and was excluded from the "
                "headline pick as an unrepresentative sample."
            )

    eligible_degradation = _eligible_for_headline(degradation_ranking, "totalQuickLaps")
    if eligible_degradation:
        degradation_methodology = (
            "Closing-average minus opening-average quick-lap time "
            "over the first/last sampled quick laps; heuristic, not a stint-aware tire model. "
            "Headline picks require a total quick-lap count at least half the field's largest."
        )

        strongest_closer = min(eligible_degradation, key=lambda row: row["deltaSeconds"])
        summary["strongestLateRaceDriver"] = strongest_closer["driver"]
        evidence.append(
            {
                "metric": "degradation",
                "driver": strongest_closer["driver"],
                "value": strongest_closer["deltaSeconds"],
                "unit": "seconds",
                "sampleSize": strongest_closer["sampleSize"],
                "methodology": degradation_methodology,
            }
        )

        largest_decline = max(eligible_degradation, key=lambda row: row["deltaSeconds"])
        summary["largestPaceDeclineDriver"] = largest_decline["driver"]
        evidence.append(
            {
                "metric": "degradation",
                "driver": largest_decline["driver"],
                "value": largest_decline["deltaSeconds"],
                "unit": "seconds",
                "sampleSize": largest_decline["sampleSize"],
                "methodology": degradation_methodology,
            }
        )

        excluded = [row["driver"] for row in degradation_ranking if row not in eligible_degradation]
        if excluded:
            warnings.append(
                f"{', '.join(excluded)} excluded from degradation headline picks as an "
                "unrepresentative quick-lap sample (likely a short or disrupted race)."
            )

    return {"summary": summary, "evidence": evidence}
