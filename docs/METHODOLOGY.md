# RaceIQ Methodology

RaceIQ is a **historical race analysis engine**, not a race simulator or strategy engine. It does
not predict or model alternative race outcomes. Every value in a RaceIQ report is calculated
directly from recorded lap timing data for a race session that already happened.

This document is the canonical methodology reference (Bryan OS repository contract). The
`/methodology` page in `apps/web` renders a public-facing summary of the same content and must
stay consistent with this file.

## Data source

The engine (`analysis/raceiq/`) is built on [FastF1](https://github.com/theOehrly/Fast-F1), a
Python package providing Formula 1 timing, telemetry, and schedule data. RaceIQ is independent of
FastF1, Formula 1, the FIA, any team, and any driver.

## Session loading

`analysis/raceiq/engine.py` calls `fastf1.get_session(year, event, "R")` and `session.load()`.
Phase 1 only supports the Race session (`SUPPORTED_SESSIONS = {"R": "Race"}` in
`analysis/raceiq/availability.py`); qualifying and sprint sessions are schema-compatible but not
yet wired into the engine or the frontend selector.

## Caching

Two layers:

1. **FastF1's local cache** (`fastf1.Cache.enable_cache(cache_dir)`) stores downloaded session
   data so repeated engine runs reuse it instead of re-fetching.
2. **The generated analysis file itself.** Once `scripts/generate_analysis.py` produces
   `data/generated/raceiq/v{analysisVersion}/{year}/{event-slug}/{session}.json`, that file is the
   cache RaceIQ's frontend reads. Regeneration only happens when the file is deliberately
   regenerated or `ANALYSIS_VERSION` changes.

## Quick-lap definition

A **quick lap** is any lap under 107% of the fastest single lap time recorded by any driver in the
session -- FastF1's default `Laps.pick_quicklaps()` threshold (`QUICKLAP_THRESHOLD = 1.07`,
verified against the installed FastF1 source on 2026-08-15). This excludes in/out laps and most
laps disrupted by pit stops, but it does **not** explicitly detect or label safety car or virtual
safety car periods. All four RaceIQ views are calculated from quick laps only.

## Metric formulas

Implemented in `analysis/raceiq/metrics.py`, covered by `analysis/tests/test_metrics.py` against
hand-calculated synthetic fixtures.

| View | Formula | Notes |
|---|---|---|
| Average pace | Mean `LapTime` per driver across quick laps, ranked fastest to slowest | `gapToFastestSeconds` is relative to the fastest *average*, not the single fastest lap |
| Lap evolution | Each quick lap's time by lap number, for the top 5 drivers by average pace | Missing laps (filtered out or not run) are absent, not interpolated or zero |
| Consistency | Standard deviation of `LapTime` per driver across quick laps | Lower is steadier; requires at least 2 quick laps per driver |
| Degradation | Mean of a driver's first 5 quick laps vs. mean of their last 5 (fewer if under 10 quick laps) | Heuristic -- see below |

## The degradation heuristic

`deltaSeconds = closingAverageSeconds - openingAverageSeconds`. A positive delta means the driver
was slower at the end of their sampled quick laps than at the start.

**This is a heuristic, not a stint-aware tire model.** It has no knowledge of tire compounds,
stint boundaries, fuel load, pit strategy, traffic, or safety-car periods. Do not read it as a
tire-degradation rate, and do not let downstream content (see `docs/CONTENT_ENGINE.md`) imply
strategy or tire conclusions this metric cannot support.

## What RaceIQ does not do

- Does not simulate or predict alternative race outcomes.
- Does not explicitly segment safety cars, virtual safety cars, or traffic.
- Does not model tire compounds, stint boundaries, or pit strategy.
- Does not use an LLM or any generative model to write its summary. `narrative.py` fills a
  deterministic template from already-computed metrics; every claim traces to a metric, driver,
  value, sample size, and methodology note via the `evidence` array in the analysis contract.
- Does not render matplotlib PNGs as the frontend's primary data source. The legacy `main.py`
  script still produces PNGs for local/lab use, but the production frontend consumes the
  structured JSON contract and renders its own interactive charts.

## Historical coverage

See [`docs/DATA_AVAILABILITY.md`](DATA_AVAILABILITY.md) for the full, sourced matrix. Summary:
lap timing, telemetry, tire-compound, and weather data are only available for **2018 onward**;
1950-2017 has schedule and classification data only, with no lap-by-lap timing, so none of
RaceIQ's four views can be produced for those seasons.

## Analysis versioning

`analysis/raceiq/schemas.py::ANALYSIS_VERSION` (currently `1.0.0`) is recorded in every generated
file's `analysisVersion` field and namespaces the cache key
(`data/generated/raceiq/v{version}/...`). A change to how a metric is calculated must bump this
version rather than silently reinterpreting previously generated files. `validate_analysis()`
rejects a payload whose `analysisVersion` doesn't match the running engine's version.

## Analysis vs. simulation

RaceIQ analyzes recorded sessions. It does not answer "what if" questions, does not run Monte
Carlo or physics-based race simulations, and does not generate alternative finishing orders. If
that capability is ever built, it must be a clearly separated, clearly labeled feature -- not an
extension of the existing four views -- and requires an explicit decision recorded in
`docs/DECISIONS.md`.

## Independence disclaimer

RaceIQ is an independent motorsport analytics project and is not affiliated with Formula 1, the
FIA, any team, or any driver. Race data is used descriptively under FastF1's publicly documented
data access. See [`docs/DATA_AVAILABILITY.md`](DATA_AVAILABILITY.md) for sourcing and
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for how the data flows from FastF1 to the public site.
