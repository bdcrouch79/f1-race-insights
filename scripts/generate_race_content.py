#!/usr/bin/env python3
"""Generate a deterministic social-media content package for one committed
RaceIQ race analysis.

This is the RaceIQ Social Content Engine (Phase 3). It is a formatting and
selection layer only: every factual claim in every generated file is read
directly from a committed `data/generated/raceiq/**/R.json` file (the same
contract `apps/web/lib/raceData.ts` renders) and `data/race-manifest.json`.
This script never calls an LLM, never fabricates a conclusion, and never
introduces a new analytical metric -- it only selects, formats, and
visualizes fields the Python analysis engine (`analysis/raceiq/`) already
computed and validated. See docs/DECISIONS.md for the full rationale.

Usage:
    python scripts/generate_race_content.py 2021 "Abu Dhabi"

Output:
    content/generated/{year}-{event-slug}/
        linkedin-personal.md
        linkedin-data.md
        instagram-caption.md
        x-thread.md
        short-video-outline.md
        content-manifest.json
        insight-card-pace.png
        insight-card-consistency.png
        insight-card-closing.png

Re-running with the same committed inputs reproduces the same text and
images (only the content-manifest.json `generatedAt` timestamp changes) --
this is what "deterministic and regenerable" means here.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from generate_analysis import slugify  # noqa: E402

SITE_URL_DEFAULT = "https://raceiq.crouchdevelopment.com"

# Kept in sync with analysis/raceiq/narrative.py::MIN_HEADLINE_SAMPLE_RATIO
# and apps/web/lib/headlineEligibility.ts::MIN_HEADLINE_SAMPLE_RATIO. A
# driver with very few quick laps relative to the field (typically an
# early retirement) can otherwise dominate a raw ranking on a handful of
# clean laps -- see docs/DECISIONS.md (2026-08-16, Monaco 2024/Sargeant).
MIN_HEADLINE_SAMPLE_RATIO = 0.5

# Mirrors apps/web/lib/raceManifest.ts::EVENT_NAME_ALIASES exactly. A
# manifest `event` query is a country/location name (the FastF1 fuzzy
# lookup query, e.g. "Germany"), but the resolved EventName often uses the
# demonym instead ("German Grand Prix") -- so the country name is never
# actually a substring of the real event name.
EVENT_NAME_ALIASES: dict[str, list[str]] = {
    "germany": ["german"],
    "italy": ["italian"],
    "turkey": ["turkish"],
    "netherlands": ["dutch"],
    "britain": ["british"],
}

COLORS = {
    "black": "#08090B",
    "panel": "#1A1E24",
    "red": "#FF2B2B",
    "orange": "#FF6B00",
    "cyan": "#30D5FF",
    "white": "#F4F6F8",
    "gray": "#8C949F",
}

ATTRIBUTION = (
    "Built by Crouch Development · Independent motorsport analytics, not "
    "affiliated with Formula 1, the FIA, any team, or any driver."
)


def _matches_query(event_name: str, query: str) -> bool:
    """Mirror raceManifest.ts::findManifestEntry's match rule exactly."""
    normalized_name = event_name.strip().lower()
    normalized_query = query.strip().lower()
    if normalized_query in normalized_name:
        return True
    return any(alias in normalized_name for alias in EVENT_NAME_ALIASES.get(normalized_query, []))


def _compare_versions(a: str, b: str) -> int:
    """Mirror apps/web/scripts/build-data.mjs::compareVersions (numeric
    per dot-separated segment, so v1.10.0 > v1.9.0)."""
    pa = [int(x) for x in a.split(".")]
    pb = [int(x) for x in b.split(".")]
    for x, y in zip(pa, pb):
        if x != y:
            return x - y
    return len(pa) - len(pb)


def find_analysis(year: int, event_query: str, session: str, generated_root: Path) -> tuple[dict[str, Any], Path]:
    """Scan committed data/generated/raceiq/v*/{year}/*/​{session}.json for
    the entry whose resolved event.name matches the query, picking the
    highest analysisVersion when more than one version is committed for
    the same race. Never calls FastF1 or any network resource -- this only
    reads already-committed, already-validated files."""
    candidates: list[tuple[str, dict[str, Any], Path]] = []
    for version_dir in sorted(generated_root.glob("v*")):
        year_dir = version_dir / str(year)
        if not year_dir.is_dir():
            continue
        for event_dir in sorted(year_dir.iterdir()):
            session_path = event_dir / f"{session}.json"
            if not session_path.is_file():
                continue
            data = json.loads(session_path.read_text())
            if data.get("event", {}).get("session") != session:
                continue
            if _matches_query(data["event"]["name"], event_query):
                candidates.append((str(data["analysisVersion"]), data, session_path))

    if not candidates:
        raise SystemExit(
            f"No committed analysis found for {year} matching event query "
            f"'{event_query}' (session {session}) under {generated_root}. "
            "This script only reads already-generated, committed races -- "
            "run scripts/generate_analysis.py first if this race hasn't "
            "been generated yet."
        )

    candidates.sort(key=lambda c: c[0].split("."), reverse=False)
    best = candidates[0]
    for c in candidates[1:]:
        if _compare_versions(c[0], best[0]) > 0:
            best = c
    return best[1], best[2]


def find_manifest_entry(year: int, event_name: str, manifest_path: Path) -> dict[str, Any] | None:
    if not manifest_path.is_file():
        return None
    manifest = json.loads(manifest_path.read_text())
    races = manifest.get("races", [])
    for entry in races:
        if entry.get("year") != year:
            continue
        if _matches_query(event_name, str(entry.get("event", ""))):
            return entry
    return None


def filter_eligible_for_headline(rows: list[dict[str, Any]], sample_key: str) -> list[dict[str, Any]]:
    """Mirror apps/web/lib/headlineEligibility.ts::filterEligibleForHeadline
    exactly, so any "top N" this script re-derives from a raw ranking table
    applies the same eligibility filter the engine's own headline picks
    already use -- otherwise a driver with an unrepresentative quick-lap
    sample could top a bar chart under a headline naming someone else."""
    if not rows:
        return rows
    typical = max(row[sample_key] for row in rows)
    threshold = typical * MIN_HEADLINE_SAMPLE_RATIO
    eligible = [row for row in rows if row[sample_key] >= threshold]
    return eligible if eligible else rows


def driver_label(drivers_by_code: dict[str, dict[str, Any]], code: str | None) -> str:
    if not code:
        return "no eligible driver"
    info = drivers_by_code.get(code)
    return info["fullName"] if info else code


@dataclass
class Claim:
    statement: str
    source: str


@dataclass
class RaceFacts:
    year: int
    event_name: str
    event_slug: str
    circuit: str | None
    date: str | None
    session: str
    analysis_version: str
    generated_at: str
    canonical_url: str
    drivers_by_code: dict[str, dict[str, Any]]
    pace_top: list[dict[str, Any]]
    consistency_top: list[dict[str, Any]]
    degradation_top: list[dict[str, Any]]
    fastest_pace_driver: str | None
    fastest_pace_value: float | None
    most_consistent_driver: str | None
    most_consistent_value: float | None
    strongest_closer_driver: str | None
    strongest_closer_value: float | None
    largest_decline_driver: str | None
    largest_decline_value: float | None
    warnings: list[str]
    manifest_entry: dict[str, Any] | None
    claims: list[Claim] = field(default_factory=list)


def build_facts(analysis: dict[str, Any], analysis_path: Path, manifest_entry: dict[str, Any] | None, site_url: str) -> RaceFacts:
    event = analysis["event"]
    year = event["year"]
    event_slug = slugify(event["name"])
    drivers_by_code = {d["code"]: d for d in analysis["drivers"]}
    summary = analysis["summary"]
    evidence_by_key = {(e["metric"], e["driver"]): e for e in analysis["evidence"]}

    pace_top = filter_eligible_for_headline(analysis["paceRanking"], "sampleSize")[:5]
    consistency_top = filter_eligible_for_headline(analysis["consistency"], "sampleSize")[:5]
    degradation_top = filter_eligible_for_headline(analysis["degradation"], "totalQuickLaps")

    claims: list[Claim] = []

    fastest = summary.get("fastestAveragePaceDriver")
    fastest_value = None
    if fastest:
        ev = evidence_by_key.get(("averagePace", fastest))
        fastest_value = ev["value"] if ev else None
        claims.append(
            Claim(
                f"{driver_label(drivers_by_code, fastest)} led average quick-lap race pace"
                + (f" at {fastest_value:.3f}s/lap" if fastest_value is not None else ""),
                "summary.fastestAveragePaceDriver + evidence[metric=averagePace]",
            )
        )

    consistent = summary.get("mostConsistentDriver")
    consistent_value = None
    if consistent:
        ev = evidence_by_key.get(("consistency", consistent))
        consistent_value = ev["value"] if ev else None
        claims.append(
            Claim(
                f"{driver_label(drivers_by_code, consistent)} was the most consistent driver"
                + (f" (stdev {consistent_value:.3f}s across quick laps)" if consistent_value is not None else ""),
                "summary.mostConsistentDriver + evidence[metric=consistency]",
            )
        )

    closer = summary.get("strongestLateRaceDriver")
    closer_value = None
    if closer:
        ev = evidence_by_key.get(("closingPace", closer)) or evidence_by_key.get(("degradation", closer))
        closer_value = ev["value"] if ev else None
        claims.append(
            Claim(
                f"{driver_label(drivers_by_code, closer)} had the strongest closing quick-lap pace",
                "summary.strongestLateRaceDriver",
            )
        )

    decline = summary.get("largestPaceDeclineDriver")
    decline_value = None
    if decline:
        ev = evidence_by_key.get(("degradation", decline))
        decline_value = ev["value"] if ev else None
        claims.append(
            Claim(
                f"{driver_label(drivers_by_code, decline)} showed the largest quick-lap pace decline"
                + (f" ({decline_value:.3f}s slower late)" if decline_value is not None else ""),
                "summary.largestPaceDeclineDriver + evidence[metric=degradation]",
            )
        )
    else:
        claims.append(
            Claim(
                "No eligible driver's closing quick-lap pace was slower than their opening pace "
                "this session, so RaceIQ did not name a largest-pace-decline headline.",
                "summary.largestPaceDeclineDriver == null (see warnings)",
            )
        )

    return RaceFacts(
        year=year,
        event_name=event["name"],
        event_slug=event_slug,
        circuit=event.get("circuit"),
        date=event.get("date"),
        session=event["session"],
        analysis_version=str(analysis["analysisVersion"]),
        generated_at=analysis["generatedAt"],
        canonical_url=f"{site_url}/race/{year}/{event_slug}",
        drivers_by_code=drivers_by_code,
        pace_top=pace_top,
        consistency_top=consistency_top,
        degradation_top=degradation_top,
        fastest_pace_driver=fastest,
        fastest_pace_value=fastest_value,
        most_consistent_driver=consistent,
        most_consistent_value=consistent_value,
        strongest_closer_driver=closer,
        strongest_closer_value=closer_value,
        largest_decline_driver=decline,
        largest_decline_value=decline_value,
        warnings=analysis.get("warnings", []),
        manifest_entry=manifest_entry,
        claims=claims,
    )


# ---------------------------------------------------------------------------
# Text templates -- deterministic string formatting only, no generation.
# ---------------------------------------------------------------------------


def _race_context(f: RaceFacts) -> str:
    if f.manifest_entry and f.manifest_entry.get("description"):
        return f.manifest_entry["description"]
    return f"{f.event_name} ({f.year})"


def render_linkedin_personal(f: RaceFacts) -> str:
    context = _race_context(f)
    lines = [
        f"I built RaceIQ to answer a question I kept asking while watching {f.event_name} coverage: the finishing order tells you who crossed the line first, but it doesn't tell you how the race actually unfolded.",
        "",
        f"RaceIQ is an independent analytics tool I built that processes real Formula 1 timing data -- thousands of individual lap times per race -- and turns it into evidence-backed answers about pace, consistency, and how a driver's pace held up over a race distance.",
        "",
        f"For {context}",
        "",
        f"RaceIQ's data shows {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average quick-lap race pace"
        + (f" at {f.fastest_pace_value:.3f}s/lap" if f.fastest_pace_value is not None else "")
        + f", {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the most consistent driver on track, and {driver_label(f.drivers_by_code, f.strongest_closer_driver)} had the strongest closing-stint pace.",
        "",
        "None of that is a guess. It comes directly from processing the session's real lap-by-lap timing data -- the same kind of raw, scattered records that sit in most businesses' systems, unread.",
        "",
        "That's the actual point of RaceIQ for me: it's a working demonstration of turning raw, high-volume data into something a person can actually use to make a decision -- which is exactly the kind of system I build for businesses at Crouch Development.",
        "",
        f"Full breakdown, charts, and methodology: {f.canonical_url}",
    ]
    return "\n".join(lines) + "\n"


def render_linkedin_data(f: RaceFacts) -> str:
    lines = [
        f"RaceIQ analysis: {f.event_name} ({f.year})",
        "",
        "Three separate, clearly-labeled metrics -- not one blended \"who was best\" score:",
        "",
        f"→ Average quick-lap pace: {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led"
        + (f" at {f.fastest_pace_value:.3f}s/lap" if f.fastest_pace_value is not None else "")
        + ".",
        f"→ Consistency (lap-time standard deviation across quick laps): {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the steadiest.",
    ]
    if f.largest_decline_driver:
        lines.append(
            f"→ Closing-pace heuristic (opening vs. closing quick-lap average): "
            f"{driver_label(f.drivers_by_code, f.largest_decline_driver)} showed the largest decline"
            + (f" ({f.largest_decline_value:.3f}s slower late)" if f.largest_decline_value is not None else "")
            + f"; {driver_label(f.drivers_by_code, f.strongest_closer_driver)} had the strongest closing pace."
        )
    else:
        lines.append(
            f"→ Closing-pace heuristic (opening vs. closing quick-lap average): no eligible driver "
            f"slowed down late this session -- {driver_label(f.drivers_by_code, f.strongest_closer_driver)} "
            f"had the strongest closing pace."
        )
    lines += [
        "",
        "Method note: pace and consistency use every \"quick lap\" (filtered for pit stops, safety cars, and outliers) across the full session. The closing-pace figure is a heuristic comparing opening vs. closing quick-lap averages -- it is not a tire-degradation model.",
        "",
        f"Full evidence, sample sizes, and methodology: {f.canonical_url}",
        "",
        "Built by Crouch Development.",
    ]
    return "\n".join(lines) + "\n"


def render_instagram_caption(f: RaceFacts) -> str:
    lines = [
        f"{f.event_name} {f.year} — what the finishing order didn't show. \U0001F3CE️",
        "",
        f"RaceIQ pace leader: {driver_label(f.drivers_by_code, f.fastest_pace_driver)}",
        f"Most consistent: {driver_label(f.drivers_by_code, f.most_consistent_driver)}",
        f"Strongest closing pace: {driver_label(f.drivers_by_code, f.strongest_closer_driver)}",
        "",
        "Real timing data, not commentary. Full breakdown at the link in bio (or search RaceIQ Crouch Development).",
        "",
        "Built by Crouch Development — independent motorsport analytics.",
        "",
        "#RaceIQ #F1 #FormulaOne #DataAnalytics #MotorsportData",
    ]
    return "\n".join(lines) + "\n"


def render_x_thread(f: RaceFacts) -> str:
    tweets = [
        f"{f.event_name} ({f.year}): the finishing order doesn't tell you how the race actually unfolded. RaceIQ processed the real lap timing data. Here's what it found. \U0001F9F5",
        f"Average quick-lap pace leader: {driver_label(f.drivers_by_code, f.fastest_pace_driver)}"
        + (f", {f.fastest_pace_value:.3f}s/lap" if f.fastest_pace_value is not None else "")
        + ".",
        f"Most consistent driver (lowest lap-time variance across quick laps): {driver_label(f.drivers_by_code, f.most_consistent_driver)}.",
    ]
    if f.largest_decline_driver:
        tweets.append(
            f"Closing pace: {driver_label(f.drivers_by_code, f.largest_decline_driver)} faded the most late in "
            f"the session; {driver_label(f.drivers_by_code, f.strongest_closer_driver)} closed strongest."
        )
    else:
        tweets.append(
            f"Closing pace: no eligible driver slowed down late this session. "
            f"{driver_label(f.drivers_by_code, f.strongest_closer_driver)} closed strongest."
        )
    tweets.append(
        f"Full pace, consistency, and closing-pace breakdown, with methodology: {f.canonical_url}"
    )
    tweets.append("Built by Crouch Development.")

    lines = [f"{i + 1}/ {t}" for i, t in enumerate(tweets)]
    return "\n\n".join(lines) + "\n"


def render_video_outline(f: RaceFacts) -> str:
    lines = [
        f"# Short-video outline — {f.event_name} ({f.year})",
        "",
        "Suitable for a 30-60 second unscripted talking-head video. Speak from these points, don't read them verbatim.",
        "",
        "## Hook (first 3-5 seconds)",
        f'"The finishing order at {f.event_name} tells you who crossed the line first. It doesn\'t tell you how the race actually went. I built a tool that processes the real lap-by-lap timing data to show you."',
        "",
        "## Talking point 1 -- Pace",
        f"RaceIQ found {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average quick-lap pace"
        + (f" at {f.fastest_pace_value:.3f} seconds a lap" if f.fastest_pace_value is not None else "")
        + " -- from real timing data, not commentary.",
        "",
        "## Talking point 2 -- Consistency",
        f"{driver_label(f.drivers_by_code, f.most_consistent_driver)} was the most consistent driver on track -- the smallest lap-time variance across the whole session.",
        "",
        "## Talking point 3 -- Closing pace",
        (
            f"{driver_label(f.drivers_by_code, f.largest_decline_driver)} faded the most late in the race, while "
            f"{driver_label(f.drivers_by_code, f.strongest_closer_driver)} had the strongest closing pace."
            if f.largest_decline_driver
            else f"No one really faded this race -- {driver_label(f.drivers_by_code, f.strongest_closer_driver)} actually had the strongest closing pace of the field."
        ),
        "",
        "## CTA",
        f'"Full breakdown at raceiq.crouchdevelopment.com — built by Crouch Development."',
    ]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Insight-card PNG generation (matplotlib, RaceIQ palette, no logos/imagery)
# ---------------------------------------------------------------------------


def _card_figure():
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(10.8, 6.0), dpi=100)
    fig.patch.set_facecolor(COLORS["black"])
    ax.set_facecolor(COLORS["black"])
    return plt, fig, ax


def _card_chrome(plt, fig, title: str, subtitle: str, f: RaceFacts) -> None:
    fig.text(0.055, 0.94, "RACE", color=COLORS["white"], fontsize=20, fontweight="bold", family="sans-serif")
    fig.text(0.145, 0.94, "IQ", color=COLORS["cyan"], fontsize=20, fontweight="bold", family="sans-serif")
    fig.text(0.945, 0.94, "raceiq.crouchdevelopment.com", color=COLORS["gray"], fontsize=10, ha="right", family="monospace")
    fig.text(0.055, 0.87, subtitle, color=COLORS["cyan"], fontsize=12, family="sans-serif")
    fig.text(0.055, 0.815, title, color=COLORS["white"], fontsize=22, fontweight="bold", family="sans-serif")
    fig.text(0.055, 0.045, ATTRIBUTION, color=COLORS["gray"], fontsize=8.5, family="sans-serif", wrap=True)


def render_pace_card(f: RaceFacts, out_path: Path) -> None:
    plt, fig, ax = _card_figure()
    rows = f.pace_top
    leader = rows[0]["averageLapTimeSeconds"] if rows else 0
    labels = [driver_label(f.drivers_by_code, r["driver"]).split(" ")[-1] for r in rows]
    gaps = [r["averageLapTimeSeconds"] - leader for r in rows]
    colors = [f.drivers_by_code.get(r["driver"], {}).get("teamColor") or (COLORS["cyan"] if i == 0 else COLORS["orange"]) for i, r in enumerate(rows)]
    y = range(len(rows))
    # Bars drawn as "headroom used" (max gap minus this driver's gap) so
    # the fastest driver's bar is the longest, matching opengraph-image.tsx.
    max_gap = max(gaps) if gaps and max(gaps) > 0 else 1.0
    bar_lengths = [max_gap - g + 0.15 for g in gaps]
    ax.barh(list(y), bar_lengths, color=colors, height=0.55)
    for i, (r, g) in enumerate(zip(rows, gaps)):
        label = "Fastest" if i == 0 else f"+{g:.2f}s"
        ax.text(bar_lengths[i] + 0.05, i, label, color=COLORS["gray"], va="center", fontsize=10, family="monospace")
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, color=COLORS["white"], fontsize=12, family="sans-serif")
    ax.invert_yaxis()
    ax.set_xticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_position([0.16, 0.14, 0.78, 0.62])
    _card_chrome(plt, fig, f.event_name, f"{f.year} · Average Quick-Lap Pace", f)
    fig.savefig(out_path, facecolor=COLORS["black"])
    plt.close(fig)


def render_consistency_card(f: RaceFacts, out_path: Path) -> None:
    plt, fig, ax = _card_figure()
    rows = sorted(f.consistency_top, key=lambda r: r["stdDevSeconds"])
    labels = [driver_label(f.drivers_by_code, r["driver"]).split(" ")[-1] for r in rows]
    values = [r["stdDevSeconds"] for r in rows]
    colors = [f.drivers_by_code.get(r["driver"], {}).get("teamColor") or (COLORS["cyan"] if i == 0 else COLORS["orange"]) for i, r in enumerate(rows)]
    y = range(len(rows))
    max_val = max(values) if values else 1.0
    ax.barh(list(y), values, color=colors, height=0.55)
    for i, v in enumerate(values):
        ax.text(v + max_val * 0.02, i, f"{v:.3f}s stdev", color=COLORS["gray"], va="center", fontsize=10, family="monospace")
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, color=COLORS["white"], fontsize=12, family="sans-serif")
    ax.invert_yaxis()
    ax.set_xticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_position([0.16, 0.14, 0.78, 0.62])
    _card_chrome(plt, fig, f.event_name, f"{f.year} · Consistency (Lower Is Steadier)", f)
    fig.savefig(out_path, facecolor=COLORS["black"])
    plt.close(fig)


def render_closing_card(f: RaceFacts, out_path: Path) -> None:
    plt, fig, ax = _card_figure()
    rows = sorted(f.degradation_top, key=lambda r: r["deltaSeconds"])[:6]
    labels = [driver_label(f.drivers_by_code, r["driver"]).split(" ")[-1] for r in rows]
    values = [r["deltaSeconds"] for r in rows]
    colors = [COLORS["cyan"] if v <= 0 else COLORS["orange"] for v in values]
    y = range(len(rows))
    ax.barh(list(y), values, color=colors, height=0.55)
    max_abs = max(abs(v) for v in values) if values else 1.0
    # Generous fixed x-limits (not autoscale) so a value label past the
    # longest bar's tip always has room and never collides with the
    # y-axis driver-name labels at the left edge of the plot.
    ax.set_xlim(-max_abs * 1.45, max_abs * 1.45)
    for i, v in enumerate(values):
        offset = max_abs * 0.08
        label = f"{v:+.2f}s"
        ax.text(v + (offset if v >= 0 else -offset), i, label, color=COLORS["gray"], va="center", ha="left" if v >= 0 else "right", fontsize=10, family="monospace")
    ax.axvline(0, color=COLORS["panel"], linewidth=1)
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, color=COLORS["white"], fontsize=12, family="sans-serif")
    ax.invert_yaxis()
    ax.set_xticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_position([0.16, 0.14, 0.78, 0.60])
    fig.text(0.055, 0.075, "Cyan = faster late (closing) · Orange = slower late · heuristic, not a tire model", color=COLORS["gray"], fontsize=8.5, family="sans-serif")
    _card_chrome(plt, fig, f.event_name, f"{f.year} · Closing-Pace Heuristic (Opening vs. Closing)", f)
    fig.savefig(out_path, facecolor=COLORS["black"])
    plt.close(fig)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def generate(year: int, event_query: str, *, session: str = "R", out_root: Path, generated_root: Path, manifest_path: Path, site_url: str) -> Path:
    analysis, analysis_path = find_analysis(year, event_query, session, generated_root)
    manifest_entry = find_manifest_entry(year, analysis["event"]["name"], manifest_path)
    facts = build_facts(analysis, analysis_path, manifest_entry, site_url)

    out_dir = out_root / f"{year}-{facts.event_slug}"
    out_dir.mkdir(parents=True, exist_ok=True)

    files: dict[str, str] = {
        "linkedin-personal.md": render_linkedin_personal(facts),
        "linkedin-data.md": render_linkedin_data(facts),
        "instagram-caption.md": render_instagram_caption(facts),
        "x-thread.md": render_x_thread(facts),
        "short-video-outline.md": render_video_outline(facts),
    }
    for name, content in files.items():
        (out_dir / name).write_text(content)

    render_pace_card(facts, out_dir / "insight-card-pace.png")
    render_consistency_card(facts, out_dir / "insight-card-consistency.png")
    render_closing_card(facts, out_dir / "insight-card-closing.png")

    manifest = {
        "race": {
            "year": facts.year,
            "eventSlug": facts.event_slug,
            "eventName": facts.event_name,
            "session": facts.session,
            "circuit": facts.circuit,
            "date": facts.date,
        },
        "source": {
            "analysisFile": str(analysis_path.relative_to(REPO_ROOT)),
            "analysisVersion": facts.analysis_version,
            "analysisGeneratedAt": facts.generated_at,
        },
        "manifest": (
            {
                "matched": True,
                "category": manifest_entry.get("category"),
                "featured": manifest_entry.get("featured"),
                "displayName": manifest_entry.get("displayName"),
            }
            if manifest_entry
            else {"matched": False}
        ),
        "canonicalUrl": facts.canonical_url,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "files": sorted(list(files.keys()) + ["insight-card-pace.png", "insight-card-consistency.png", "insight-card-closing.png"]),
        "claims": [{"statement": c.statement, "source": c.source} for c in facts.claims],
    }
    (out_dir / "content-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")

    print(f"Wrote content package to {out_dir}")
    return out_dir


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("year", type=int)
    parser.add_argument("event", type=str, help="Manifest event query or a substring of the real event name, e.g. 'Abu Dhabi'")
    parser.add_argument("--session", default="R")
    parser.add_argument("--out-root", default=str(REPO_ROOT / "content" / "generated"))
    parser.add_argument("--generated-root", default=str(REPO_ROOT / "data" / "generated" / "raceiq"))
    parser.add_argument("--manifest", default=str(REPO_ROOT / "data" / "race-manifest.json"))
    parser.add_argument("--site-url", default=SITE_URL_DEFAULT)
    args = parser.parse_args()

    generate(
        args.year,
        args.event,
        session=args.session,
        out_root=Path(args.out_root),
        generated_root=Path(args.generated_root),
        manifest_path=Path(args.manifest),
        site_url=args.site_url,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
