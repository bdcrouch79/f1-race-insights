# RaceIQ Current State

Last verified: 2026-08-16

## Implemented

- **Python analysis engine** (`analysis/raceiq/`): `engine.py`, `metrics.py`, `narrative.py`,
  `schemas.py`, `availability.py`. Refactored from the original `main.py` calculations into
  callable, parameter-validated, metric-level-fault-tolerant functions that return the versioned
  JSON contract (`ANALYSIS_VERSION = "1.1.1"`). Original `main.py` and root `requirements.txt` are
  untouched and still work standalone.
- **Headline-eligibility filter** (`narrative.py`, added in v1.1.0): the four `summary` headline
  picks (fastest average pace, most consistent, strongest closing, largest decline) now require a
  driver's quick-lap sample to be at least half the field's largest before they're eligible for a
  headline. This exists because real data surfaced it: Monaco 2024's Logan Sargeant (14 quick laps
  before an early incident, field high ~50) topped the raw average-pace and degradation-decline
  rankings, which the social card would have stated as an unqualified "led average race pace" —
  correct arithmetic, misleading headline. The full, unfiltered per-driver rankings are unaffected;
  an excluded driver's real sample size is recorded in `warnings`.
- **Decline-sign fix** (`narrative.py`, added in v1.1.1): verifying the v1.1.0 regeneration
  surfaced a second issue in the same family. Every eligible Monaco 2024 driver's closing pace beat
  their opening pace (all negative deltas, likely a red flag bunching up the field), so the old
  `max(...)` pick still labeled the least-improved driver's *improvement* as "Largest Pace
  Decline." `largestPaceDeclineDriver` now only populates when the pick's delta is actually
  positive; otherwise RaceIQ names no decline headline and says why in `warnings`. See
  `docs/DECISIONS.md` for both fixes.
- **Team-color identity swatches**: `analysis/raceiq/engine.py::_team_color` looks up each driver's
  real per-season team color from FastF1's own color mapping (`fastf1.plotting.get_team_color`,
  season-aware) and attaches it to `drivers[].teamColor`. Rendered as a small color dot next to
  driver names on summary cards, the evidence panel, and the social card's pace bars. This is a
  factual color, not a team logo — RaceIQ still does not use any official F1/team logo or
  trademarked graphic (see `docs/DECISIONS.md`).
- **Generation scripts**: `scripts/generate_analysis.py` (real FastF1 session -> committed JSON)
  and `scripts/generate_demo_fixture.py` (synthetic fixture for interface verification, now
  includes fictional `teamColor` values so the demo report demonstrates the swatch feature too).
- **Next.js frontend** (`apps/web`): homepage, `/race/[year]/[event]`, `/archive`, `/methodology`,
  `/about`, dynamic OG social card, sitemap/robots, RaceIQ Weekend Brief signup form and API route,
  RaceIQ visual design system (palette, typography, chart components via Apache ECharts). The
  homepage now features the best available real analysis (falling back to the demo fixture only
  when none exists) and its secondary CTA links to it by name.
- **Required Bryan OS repository documents**: this file plus `AGENTS.md`, `docs/PRODUCT.md`,
  `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/DATABASE_TARGET.md`,
  `docs/OFFER.md`, `docs/GROWTH.md`, `docs/METHODOLOGY.md`, `docs/DATA_AVAILABILITY.md`,
  `docs/CONTENT_ENGINE.md`, `.github/PULL_REQUEST_TEMPLATE.md`.

## Verified

- `cd analysis && python3 -m pytest -q` -- 29 passed (metrics math against hand-calculated
  synthetic fixtures, availability rules, schema validation, headline-eligibility filtering and
  the decline-sign fix mirroring real Monaco 2024 data exactly, one full `engine.run_analysis()`
  integration test against a monkeypatched FastF1 session).
- `cd apps/web && npm run typecheck` -- passes.
- `cd apps/web && npx eslint .` -- passes (no errors).
- `cd apps/web && npm run test` -- 31 passed across 9 files (components, data resolution, format
  helpers, metadata generation, subscribe-route validation/fail-safe behavior, and a schema
  contract test against a real engine-generated fixture).
- `cd apps/web && npm run build` -- production build succeeds.
- Manual browser verification (Playwright, desktop and mobile viewports) against `next start`:
  homepage, the demo race report, two successive real Monaco 2024 reports (pre- and post-decline
  fix), and the dynamic OG image (both demo and real) all rendered correctly, including the
  team-color swatches on summary cards.
- **Real analyses were generated twice** (Bryan's machine, network-unrestricted): 2024 Monaco Grand
  Prix under `1.0.0` (surfaced the Sargeant sample-size issue) and again under `1.1.0` (surfaced the
  decline-sign issue while verifying the first fix). Both proved the full generation pipeline works
  end to end; both were superseded by the fixes they revealed.

## Not verified / blocked

- **No real race analysis is currently committed.** Two real Monaco 2024 files have now been
  generated and deliberately deleted in turn, each because verifying it surfaced a real headline
  accuracy bug (see `docs/DECISIONS.md`, both 2026-08-16 entries) rather than because the
  underlying pace/consistency/degradation math was wrong. `data/generated/` is empty again, this
  time under the `1.1.1` fix.
  - **Next action**: from a network-unrestricted environment (confirmed working twice: Bryan's
    machine), pull this branch and rerun `python scripts/generate_analysis.py 2024 Monaco` (the
    FastF1 local cache makes this fast) to regenerate under `analysisVersion 1.1.1`, then commit
    the resulting file under `data/generated/`. Recommend actually reading the summary this time
    before treating it as final, in case a third edge case shows up. This build environment's own
    egress policy still denies `livetiming.formula1.com` and `api.jolpi.ca` (verified via the agent
    proxy status endpoint, HTTP 403 policy denial), so generation must keep happening outside this
    sandbox.
- **No deployment exists.** Frontend provider: intended Cloudflare (`raceiq-web`,
  `raceiq.crouchdevelopment.com`), consistent with other current Crouch Development properties,
  but no Cloudflare project has been created or connected. Analysis provider: none (see
  `docs/ARCHITECTURE.md` -- Phase 1 uses precomputed artifacts, not a hosted Python service).
  - **Next action**: Bryan decides and creates the Cloudflare Pages/Workers project (or confirms a
    different provider), connects this repository, and only then is DNS/domain attachment
    considered -- per Bryan OS stop conditions, none of that was done automatically here.
- **RaceIQ Weekend Brief signup is code-complete but not connected.** `BREVO_API_KEY` is not
  configured; the route (`apps/web/app/api/subscribe/route.ts`) fails safely with HTTP 503 and a
  clear message, with no partial side effects. The Brevo list ID for "RaceIQ Weekend Brief" has not
  been created or verified.
  - **Next action**: Bryan creates the Brevo list, verified sender (`media@crouchdevelopment.com`),
    and the `RACEIQ_*` contact attributes in Brevo; then the `BREVO_API_KEY` secret is added to the
    hosting platform (never committed) and the list ID is wired into the route.
- **Social card on Cloudflare**: verified working under `next build` + `next start` (Node.js). Not
  yet verified on Cloudflare Workers, where `node:fs` access to the repository's `data/**` may not
  resolve at request time -- see the risk and fallback plan in `docs/ARCHITECTURE.md`.

## Deployment state

- **Frontend provider**: none yet (intended: Cloudflare Workers/Pages).
- **Production domain**: none attached (intended: `raceiq.crouchdevelopment.com`).
- **Analysis provider**: none (precomputed artifacts committed to this repository; see
  `docs/ARCHITECTURE.md`).
- **Email**: Resend/Microsoft 365 conventions from Bryan OS not yet applied to RaceIQ; only the
  planned Brevo Weekend Brief list is relevant so far, and it is not yet created.

## Bryan OS registration

- Registered `raceiq` in `bdc-os/registry/apps.yaml` as an evolution of
  `bdcrouch79/f1-race-insights` (not a new repository, not a duplicate record).
- `bash scripts/check-control-plane.sh` was run against `bdc-os` after registering: 0 errors, 0
  warnings, all checks PASS (26 applications, route coverage complete).

## Exact next action

1. From a network-unrestricted environment, generate and commit at least one real race analysis
   under the current engine version (`python scripts/generate_analysis.py 2024 Monaco`).
2. Bryan selects and creates the Cloudflare (or alternative) hosting project for `apps/web`,
   including verifying the `opengraph-image` route's `node:fs` behavior on that platform before
   launch.
3. Bryan creates the Brevo "RaceIQ Weekend Brief" list, sender, and attributes, then provides the
   verified list ID and `BREVO_API_KEY` secret to the hosting platform.
4. Only after 1-3: attach the `raceiq.crouchdevelopment.com` domain and flip the frontend from
   preview to production review per `bdc-os/docs/BUILD_AND_PREVIEW_WORKFLOW.md`.
