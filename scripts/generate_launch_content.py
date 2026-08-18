#!/usr/bin/env python3
"""Generate the RaceIQ launch campaign package (Phase 3, Part 6).

Reuses generate_race_content.py's fact-building (same committed analysis
JSON + manifest, same eligibility filtering, no new analytical logic) for
one selected race with strong, verified findings, and produces the
launch-specific narrative files into content/launch/. This is a one-time
campaign, not a per-race generator -- see scripts/generate_race_content.py
for the reusable per-race content engine.

Usage:
    python scripts/generate_launch_content.py 2021 "Abu Dhabi"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from generate_race_content import (  # noqa: E402
    SITE_URL_DEFAULT,
    RaceFacts,
    build_facts,
    driver_label,
    find_analysis,
    find_manifest_entry,
)

SITE_URL = SITE_URL_DEFAULT


def render_launch_linkedin(f: RaceFacts) -> str:
    lines = [
        "RaceIQ started as a Python experiment on my own machine.",
        "",
        f"I wanted to know something simple: at a race like {f.event_name} ({f.year}), does the finishing order actually tell you who had the best pace? So I started pulling real Formula 1 timing data -- thousands of individual lap times per session -- and processing it myself.",
        "",
        "That experiment is now a production intelligence platform. RaceIQ processes real session data into pace, consistency, and closing-pace evidence for 20 real, historic Formula 1 races, and publishes the full breakdown -- methodology and sample sizes included -- for anyone to explore.",
        "",
        f"For {f.event_name}: RaceIQ's data shows {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average quick-lap pace"
        + (f" at {f.fastest_pace_value:.3f}s/lap" if f.fastest_pace_value is not None else "")
        + f", {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the most consistent driver, and {driver_label(f.drivers_by_code, f.strongest_closer_driver)} had the strongest closing pace.",
        "",
        "The bigger point isn't motorsport. It's what building RaceIQ proved to me: the same systems-thinking that turns thousands of scattered timing records into a clear, evidence-backed answer is exactly what turns a business's scattered data -- spreadsheets, tickets, timesheets, CRM exports -- into decisions someone can actually act on. That's the work I do at Crouch Development.",
        "",
        f"Explore all 20 races: {SITE_URL}",
    ]
    return "\n".join(lines) + "\n"


def render_launch_facebook(f: RaceFacts) -> str:
    lines = [
        f"I built something I've wanted for a while: a tool that looks past the finishing order of a Formula 1 race and shows you how it actually unfolded.",
        "",
        f"RaceIQ started as a personal Python project. It's now a real, working site that processes real race timing data -- pace, consistency, and closing-pace evidence -- for 20 historic F1 races, and explains the method behind every number.",
        "",
        f"Case in point, {f.event_name} ({f.year}): {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average pace, {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the steadiest driver on track, and {driver_label(f.drivers_by_code, f.strongest_closer_driver)} closed the race the strongest. All from real lap-by-lap data, not commentary.",
        "",
        f"Take a look, and if you want to know what a similar system could do for your own business's data, that's literally what I do for a living. {SITE_URL}",
    ]
    return "\n".join(lines) + "\n"


def render_launch_instagram(f: RaceFacts) -> str:
    lines = [
        "RaceIQ went from a Python side project to a real, live site. \U0001F680",
        "",
        f"20 real F1 races. Real timing data. Real evidence — not commentary.",
        "",
        f"{f.event_name} {f.year}: {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led the pace, {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the steadiest, {driver_label(f.drivers_by_code, f.strongest_closer_driver)} closed strongest.",
        "",
        "Link in bio. Built by Crouch Development.",
        "",
        "#RaceIQ #F1 #FormulaOne #BuildInPublic #DataAnalytics",
    ]
    return "\n".join(lines) + "\n"


def render_launch_x(f: RaceFacts) -> str:
    tweets = [
        "RaceIQ started as a Python experiment. It's now a live site that processes real F1 timing data into pace, consistency, and closing-pace evidence for 20 real races. \U0001F9F5",
        f"{f.event_name} ({f.year}): {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average pace, {driver_label(f.drivers_by_code, f.most_consistent_driver)} was the steadiest, {driver_label(f.drivers_by_code, f.strongest_closer_driver)} closed strongest. Real data, full methodology.",
        f"Explore all 20 races: {SITE_URL}",
        "The same systems-thinking behind this is what I use to turn scattered business data into decisions at Crouch Development.",
    ]
    lines = [f"{i + 1}/ {t}" for i, t in enumerate(tweets)]
    return "\n\n".join(lines) + "\n"


def render_launch_video_outline(f: RaceFacts) -> str:
    lines = [
        "# Launch video outline",
        "",
        "Suitable for a 30-60 second unscripted talking-head video.",
        "",
        "## Hook",
        '"I built a tool that started as a Python experiment on my laptop. It\'s now a real, live site with 20 real Formula 1 races on it."',
        "",
        "## Talking point 1 -- What it is",
        "RaceIQ processes real F1 lap timing data -- thousands of records per race -- into pace, consistency, and closing-pace evidence. Not commentary, not opinion.",
        "",
        "## Talking point 2 -- Proof, not a pitch",
        (
            f"{f.event_name} {f.year}: RaceIQ's data shows {driver_label(f.drivers_by_code, f.fastest_pace_driver)} led average pace and "
            f"{driver_label(f.drivers_by_code, f.most_consistent_driver)} was the steadiest driver on track -- straight from the real session data."
        ),
        "",
        "## Talking point 3 -- Why it matters beyond racing",
        "The same process that turns scattered timing records into a clear answer is what I use to turn a business's scattered data into decisions. That's the whole idea behind Crouch Development.",
        "",
        "## CTA",
        f'"Go explore all 20 races at raceiq.crouchdevelopment.com."',
    ]
    return "\n".join(lines) + "\n"


def render_launch_sequence(f: RaceFacts) -> str:
    lines = [
        "# RaceIQ launch sequence",
        "",
        "A suggested order for publishing the launch package. Each step links to its file in this same content/launch/ directory. Bryan approves and schedules each post manually -- nothing here posts automatically.",
        "",
        "1. **Day 1 -- LinkedIn** (`launch-linkedin.md`): the founder story post. Why RaceIQ exists, what it demonstrates, one real finding from "
        + f"{f.event_name}, link to the site.",
        "2. **Day 1 -- X thread** (`launch-x.md`): same story, condensed to a 4-tweet thread.",
        "3. **Day 2 -- Instagram** (`launch-instagram.md`): visual-first caption, pair with `content/generated/2021-abu-dhabi-grand-prix/insight-card-pace.png`.",
        "4. **Day 2 -- Facebook** (`launch-facebook.md`): broader/more casual framing for a general audience.",
        "5. **Day 3 -- Short video** (`launch-video-outline.md`): record and post an unscripted 30-60s video following the outline; caption it with a shortened version of the LinkedIn post.",
        "6. **Ongoing** -- once the launch package has run, use `scripts\\build-race-content.ps1 -Year <year> -Event \"<event>\"` to generate a fresh content package for any of the other 19 races and continue posting on a regular cadence.",
        "",
        f"Every post links to {SITE_URL}. No post claims a specific driver \"won\" the race -- RaceIQ's data covers pace, consistency, and closing-pace evidence only, not finishing order.",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("year", type=int)
    parser.add_argument("event", type=str)
    parser.add_argument("--session", default="R")
    parser.add_argument("--out-root", default=str(REPO_ROOT / "content" / "launch"))
    parser.add_argument("--generated-root", default=str(REPO_ROOT / "data" / "generated" / "raceiq"))
    parser.add_argument("--manifest", default=str(REPO_ROOT / "data" / "race-manifest.json"))
    parser.add_argument("--site-url", default=SITE_URL_DEFAULT)
    args = parser.parse_args()

    analysis, analysis_path = find_analysis(args.year, args.event, args.session, Path(args.generated_root))
    manifest_entry = find_manifest_entry(args.year, analysis["event"]["name"], Path(args.manifest))
    facts = build_facts(analysis, analysis_path, manifest_entry, args.site_url)

    out_dir = Path(args.out_root)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = {
        "launch-linkedin.md": render_launch_linkedin(facts),
        "launch-facebook.md": render_launch_facebook(facts),
        "launch-instagram.md": render_launch_instagram(facts),
        "launch-x.md": render_launch_x(facts),
        "launch-video-outline.md": render_launch_video_outline(facts),
        "launch-sequence.md": render_launch_sequence(facts),
    }
    for name, content in files.items():
        (out_dir / name).write_text(content)

    print(f"Wrote launch package to {out_dir} (race: {facts.event_name} {facts.year})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
