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
  positive; otherwise RaceIQ names no decline headline and says why in `warnings`.
- **Social-card consistency fix** (`apps/web/lib/headlineEligibility.ts`, frontend-only, no
  version bump): verifying the v1.1.1 regeneration surfaced a third bug -- the social card's
  headline text used the fixed `summary.fastestAveragePaceDriver`, but its bar chart independently
  re-derived a "top 5" from the raw, unfiltered `paceRanking`, so Sargeant's bar still rendered as
  the longest/fastest directly under text naming Hamilton. Fixed by applying the same eligibility
  filter to the card's bar chart and recomputing gaps relative to the eligible leader rather than
  trusting `gapToFastestSeconds` (which is relative to the single fastest driver overall). See
  `docs/DECISIONS.md` for all three fixes.
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
- `cd apps/web && npm run test` -- 35 passed across 10 files (components, data resolution, format
  helpers, metadata generation, subscribe-route validation/fail-safe behavior, the social-card
  eligibility filter, and a schema contract test against a real engine-generated fixture).
- `cd apps/web && npm run build` -- production build succeeds; `/race/2024/monaco-grand-prix`
  statically generated alongside the demo route.
- Manual browser verification (Playwright, desktop and mobile viewports) against `next start`:
  homepage, the demo race report, three successive real Monaco 2024 reports (one per fix), and the
  dynamic OG image (both demo and real, pre- and post-social-card fix) all rendered correctly,
  including the team-color swatches on summary cards. The final render was read carefully end to
  end -- headline text, warnings, full tables, and the social card -- and is internally consistent.

## Real data status

**One real analysis is committed and verified**: 2024 Monaco Grand Prix,
`data/generated/raceiq/v1.1.1/2024/monaco-grand-prix/R.json`, generated on Bryan's machine
(network-unrestricted) and confirmed correct after three rounds of fixes, each caught by actually
reading the output rather than trusting the arithmetic:

1. **v1.0.0**: Sargeant's 14-lap sample topped "fastest average pace" and "largest pace decline" --
   fixed by the headline-eligibility filter.
2. **v1.1.0**: with Sargeant excluded, every remaining eligible driver had *improved* late
   (negative delta), so the old code still labeled the least-improved one a "decline" -- fixed by
   requiring a positive delta for that headline.
3. **v1.1.1 data, frontend-only fix**: the social card's headline text was correct but its bar
   chart still derived its own unfiltered "top 5" from `paceRanking`, so Sargeant's bar still
   rendered as the fastest under text naming Hamilton -- fixed in
   `apps/web/lib/headlineEligibility.ts`; no further regeneration was needed for this one.

## Not verified / blocked

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

1. ~~Generate and commit at least one real race analysis.~~ Done: 2024 Monaco Grand Prix is
   committed under `analysisVersion 1.1.1` and verified. Generate more races the same way
   (`python scripts/generate_analysis.py <year> <event>`) whenever more coverage is wanted --
   actually read the resulting summary before committing, per the three fixes above.
2. Bryan selects and creates the Cloudflare (or alternative) hosting project for `apps/web`,
   including verifying the `opengraph-image` route's `node:fs` behavior on that platform before
   launch.
3. Bryan creates the Brevo "RaceIQ Weekend Brief" list, sender, and attributes, then provides the
   verified list ID and `BREVO_API_KEY` secret to the hosting platform.
4. Only after 2-3: attach the `raceiq.crouchdevelopment.com` domain and flip the frontend from
   preview to production review per `bdc-os/docs/BUILD_AND_PREVIEW_WORKFLOW.md`.
