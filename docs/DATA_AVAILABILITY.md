# RaceIQ Data Availability

This is the verified historical-coverage record referenced by `docs/METHODOLOGY.md`,
`analysis/raceiq/availability.py`, and `apps/web/lib/availability.ts`. **Do not publish a broader
historical claim without updating this file and its verification date.**

## The claim under audit

The working assumption going into this build was: *"RaceIQ can analyze any race dating back to
2000."* That claim is **not supported** for RaceIQ's four analysis views and must not be published
as-is.

## What was checked

- The committed `main.py` and `docs/methodology.md` (superseded by this document and
  `docs/METHODOLOGY.md`) already stated the engine is "not positioned as a production application"
  and described only four basic analyses -- no mention of a validated multi-season range.
- Repository history: `bdcrouch79/f1-race-insights` has a single branch (`main`), 7 commits, all
  dated March 2026, and no evidence of a broader simulation or multi-season engine in any deleted
  or renamed file, branch, or tag.
- The installed FastF1 package (`3.8.3`) and its official GitHub repository description
  (`theOehrly/Fast-F1`), verified 2026-08-15: *"Timing data, car telemetry and position data is
  available for the 2018 and later seasons. Schedule information and session results are available
  for older seasons too, limited to Ergast web api."*
- `fastf1.core.Laps.pick_quicklaps()` source (installed package), confirming the quick-lap
  threshold is 107% of the fastest lap in the filtered set (`QUICKLAP_THRESHOLD = 1.07`).
- Whether the same metrics are available across all claimed seasons: no, they are not -- see the
  matrix below.

## Verified coverage matrix

| Season range | Schedule | Classification / results | Lap timing | Telemetry | Tire compounds | Weather | RaceIQ's 4 analysis views |
|---|---|---|---|---|---|---|---|
| 1950-2017 | Yes (Ergast-derived) | Yes (Ergast-derived) | **No** | **No** | **No** | **No** | **Not available** |
| 2018-present | Yes | Yes | Yes | Yes | Yes (via lap data) | Yes | Available |

Source: FastF1 official documentation and GitHub repository (`theOehrly/Fast-F1`), verified
2026-08-15. Re-verify before changing `LAP_TIMING_MIN_SEASON` in
`analysis/raceiq/availability.py` or `LAP_TIMING_MIN_SEASON` in `apps/web/lib/availability.ts`.

Within the 2018-present range, a specific session can still fail to load or load incompletely
(network issues, an unusual session, a FastF1-side data gap). `analysis/raceiq/engine.py` handles
that as a per-metric warning, not a crash -- it does not guarantee every 2018+ session succeeds,
only that the season is in FastF1's documented coverage window.

## What RaceIQ actually supports in Phase 1

- **Sessions**: Race (`R`) only. Qualifying, sprint, and practice are schema-compatible
  (`analysis/raceiq/availability.py::SUPPORTED_SESSIONS`) but not wired into the engine or
  frontend selector yet.
- **Seasons**: 2018 through the current season, for the four analysis views. Pre-2018 requests are
  accepted (not a validation error) and return a schema-valid payload with
  `availability.lapTiming = false` and an explanatory warning, never a crash and never fabricated
  metrics.
- **Metrics**: average pace, lap evolution, consistency, degradation -- all computed identically
  across the supported range; none are approximated or backfilled for unsupported seasons.

## How the frontend communicates this

- `AvailabilityBadges` shows per-metric availability (lap timing, telemetry, tire compounds,
  weather) on every race report.
- `/race/[year]/[event]` renders an honest "limited data" state instead of a dashboard when
  `availability.lapTiming` is false.
- `/methodology` and `/about` state the 2018+ boundary in plain language.
- The homepage season selector is bounded to `LAP_TIMING_MIN_SEASON`-current season; it does not
  offer pre-2018 seasons as if they produced a full report.

## Verification date

2026-08-15, by direct inspection of the installed `fastf1==3.8.3` package source and its official
GitHub repository description. Re-run this verification (and update this date) before any future
change to the supported season range or before publishing a public claim about historical
coverage beyond what is stated above.
