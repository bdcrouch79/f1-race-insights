# RaceIQ Current State

Last verified: 2026-08-17

## Implemented

- **Race Library Engine (Phase 1 recovery, local, Windows entry point)**: a version-controlled
  curated manifest of 20 notable races (`data/race-manifest.json`, 2018-2024, each with a FastF1
  event query, display name, editorial category, featured flag, and a short neutral, publicly
  sourced description -- see `docs/DECISIONS.md`) drives generation instead of a hardcoded list.
  `scripts/generate_batch.py` was rewritten to be manifest-driven: it resolves each entry against
  FastF1's own schedule (`fastf1.get_event`) before attempting a full session load, so a bad
  identifier fails fast with FastF1's own reason instead of downloading anything; skips races that
  already have a schema-valid committed analysis unless `--force` is passed; supports a single race
  via `--year`/`--event`; never lets one race's failure stop the batch; and prints a final
  generated/skipped/failed summary. `scripts/validate_generated.py` is new -- it re-validates every
  committed `data/generated/` and `data/fixtures/` file against the existing
  `raceiq.schemas.validate_analysis` contract (no duplicate validation logic). None of this touches
  `analysis/raceiq/` (the engine) or its contract; `scripts/generate_analysis.py` is still the only
  thing that actually calls `run_analysis`.
  `scripts\build-race-library.ps1` is the new Windows entry point tying it together: creates/reuses
  `.venv`, installs `analysis/requirements.txt`, creates/reuses `cache/`, runs the manifest-driven
  generation, runs the new JSON validation script, runs `pytest`, then runs the frontend's
  test/typecheck/lint/build -- and prints one final PASS/FAIL/SKIP report per stage. See "Race
  Library Engine: how to run it" below for the exact command and what it needs installed.
- **Manifest editorial metadata surfaced in the archive** (additive, no redesign):
  `apps/web/lib/raceManifest.ts` reads `data/race-manifest.json` server-side and matches a real
  generated race to its manifest entry by year + the actual FastF1-resolved event name (not a
  predicted slug -- the manifest doesn't store one, since guessing it wrong would silently break the
  join; see `docs/DECISIONS.md`). `apps/web/app/archive/page.tsx` looks up each generated race's
  entry and `components/ArchiveGrid.tsx` renders its category, a "Featured" badge, and its
  description when a match exists; a race with no manifest match (or not yet generated) renders
  exactly as before. Covered by `apps/web/tests/raceManifest.test.ts`.
- **Stale demo fixture fixed**: running the new `scripts/validate_generated.py` against the
  already-committed repository immediately caught a real, pre-existing bug --
  `data/fixtures/demo-race.json` was still `analysisVersion "1.1.0"`, one version behind the
  engine's current `ANALYSIS_VERSION` ("1.1.1") after the 2026-08-16 decline-sign fix. Regenerated
  via the existing `scripts/generate_demo_fixture.py` (synthetic, no network); now validates clean.

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
- `python scripts/validate_generated.py` -- 2/2 committed JSON files valid (the real Monaco 2024
  analysis and the demo fixture) against `raceiq.schemas.validate_analysis`.
- `python scripts/generate_batch.py` logic (manifest loading, `--year`/`--event` selection, the
  skip-existing-valid-analysis check, and the generated/skipped/failed branches of `run_one()`)
  exercised directly with mocked `fastf1.get_event`/`subprocess.run` calls in this sandbox, since
  its own egress policy blocks FastF1's real hosts (see below) -- confirms the control flow (skip,
  resolve-failure, generation-failure, slug-mismatch detection) behaves correctly without asserting
  anything about real FastF1 data.
- `cd apps/web && npm run typecheck` -- passes.
- `cd apps/web && npx eslint .` -- passes (no errors).
- `cd apps/web && npm run test` -- 40 passed across 11 files (components, data resolution, format
  helpers, metadata generation, subscribe-route validation/fail-safe behavior, the social-card
  eligibility filter, a schema contract test against a real engine-generated fixture, and the new
  race-manifest lookup test).
- `cd apps/web && npm run build` -- production build succeeds; `/race/2024/monaco-grand-prix`
  statically generated alongside the demo route.
- Server smoke check (`next start`, curled locally): `/archive` renders the "Featured" badge,
  `classic circuit` category, and the manifest description for the real 2024 Monaco Grand Prix
  entry, confirming the new `raceManifest.ts` join actually reaches the page, not just its test.
- Manual browser verification (Playwright, desktop and mobile viewports) against `next start`:
  homepage, the demo race report, three successive real Monaco 2024 reports (one per fix), and the
  dynamic OG image (both demo and real, pre- and post-social-card fix) all rendered correctly,
  including the team-color swatches on summary cards. The final render was read carefully end to
  end -- headline text, warnings, full tables, and the social card -- and is internally consistent.
  (Predates this change; not re-run here since nothing in this change touches the race-report route
  itself.)

## Race Library Engine: how to run it

`scripts\build-race-library.ps1` is Windows-only (PowerShell) and requires real network access to
FastF1's data sources, so it has been code-verified in this sandbox (see "Verified" above and
`docs/DECISIONS.md`) but not actually executed end to end -- this sandbox's egress policy denies
`livetiming.formula1.com`/`api.jolpi.ca`, and PowerShell itself isn't installed here to even run the
script's syntax. Run it on Bryan's machine:

```powershell
.\scripts\build-race-library.ps1              # generate every manifest race not already committed
.\scripts\build-race-library.ps1 -Year 2024 -Event Monaco   # one race (already committed; skips unless -Force)
.\scripts\build-race-library.ps1 -Force        # regenerate every manifest race from scratch
```

Requires Python 3.11+ and Node.js 22 on `PATH` (the script tells you exactly what's missing and
where to get it if either isn't found). Generates into `data/generated/raceiq/v1.1.1/<year>/<event
slug>/R.json` -- review with `git status`/`git diff`, then `git add data/generated` (and
`data/race-manifest.json` if you edited it) and commit; the script never commits anything itself.

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

**Still only one race** -- this change adds the manifest and the repeatable local pipeline
(`scripts\build-race-library.ps1`) to generate the other 19 curated races, but does not itself add
any new real analysis: this sandbox has no network access to FastF1's data sources (see "Race
Library Engine: how to run it" above), so nothing beyond Monaco has actually been generated.

## Not verified / blocked

- **Not actually deployed yet, but the deployment path is built and build-verified.**
  `apps/web` has real, tested Cloudflare Workers deployment tooling (`wrangler.jsonc`,
  `open-next.config.ts`, `npm run cf:build`/`cf:deploy`, `.github/workflows/
  deploy-cloudflare.yml`) targeting Worker name `raceiq-web`. `npm run cf:build` succeeds locally
  and `npx wrangler deploy --dry-run` validates the complete asset bundle (62 files, ~8.6 MB) --
  see `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` (2026-08-16) for the two real build bugs
  found and fixed getting here. What's missing is credentials: this session has read-only
  Cloudflare account access (confirmed via the account's Workers list: `raceiq-web` doesn't exist
  yet) but no deploy token, and creating one is Bryan's action.
  - **Next action** (about 5 minutes): 
    1. In the Cloudflare dashboard: **My Profile → API Tokens → Create Token → Edit Cloudflare
       Workers** template (or a custom token scoped to Workers Scripts:Edit for the account).
    2. Copy the token, and find the Account ID on the Cloudflare dashboard's Workers & Pages
       overview page (right-hand sidebar).
    3. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
       -- add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` with those two values.
    4. Merge this branch to `main` (or push directly to `main` once merged), or trigger the
       **Deploy RaceIQ to Cloudflare** workflow manually from the Actions tab
       (`workflow_dispatch`). It builds, tests, and deploys automatically; the job fails fast with
       a clear message if either secret is missing.
    5. The result is live at `https://raceiq-web.<your-account-subdomain>.workers.dev` --
       Cloudflare shows the account subdomain on the same Workers & Pages overview page. Attaching
       `raceiq.crouchdevelopment.com` is a separate, explicit step after that (Cloudflare
       dashboard: the Worker's Settings → Domains & Routes → Add Custom Domain) -- the deploy
       workflow does not touch DNS or custom domains at all, by design.
- **RaceIQ Weekend Brief signup is code-complete but not connected.** `BREVO_API_KEY` is not
  configured; the route (`apps/web/app/api/subscribe/route.ts`) fails safely with HTTP 503 and a
  clear message, with no partial side effects. The Brevo list ID for "RaceIQ Weekend Brief" has not
  been created or verified.
  - **Next action**: Bryan creates the Brevo list, verified sender (`media@crouchdevelopment.com`),
    and the `RACEIQ_*` contact attributes in Brevo; adds `BREVO_API_KEY` as a GitHub repository
    secret (same place as the Cloudflare secrets above) -- the deploy workflow then automatically
    syncs it to the Worker's runtime secrets on the next deploy; and the Brevo list ID gets wired
    into the route in a follow-up change.

## Deployment state

- **Frontend provider**: Cloudflare Workers, tooling built and build-verified; not yet actually
  deployed (no API token configured yet -- see above).
- **Production domain**: none attached (target: `raceiq.crouchdevelopment.com`, attached only after
  a first successful deploy is verified on the `*.workers.dev` subdomain).
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
   committed under `analysisVersion 1.1.1` and verified. ~~Build a repeatable local pipeline to
   generate the rest of a curated set.~~ Done: `scripts\build-race-library.ps1` plus
   `data/race-manifest.json` (20 curated races, 2018-2024) -- see "Race Library Engine: how to run
   it" above. **Remaining**: Bryan runs `.\scripts\build-race-library.ps1` on a machine with real
   network access, reads each race's summary before committing (per the three fixes above -- the
   headline-eligibility and decline-sign filters exist because reading real output caught real
   bugs), and commits `data/generated` once satisfied. Expect some manifest entries to fail or need
   a corrected `event` query the first time -- FastF1's own resolution error (printed by the script)
   says why; that's the intended fail-fast behavior, not a bug.
2. ~~Build and verify Cloudflare deployment tooling.~~ Done -- see "Not verified / blocked" above.
   Remaining: Bryan creates the Cloudflare API token and adds the two GitHub secrets, then merges
   this branch (or triggers the workflow manually) to get a first live deploy on `*.workers.dev`.
3. Bryan creates the Brevo "RaceIQ Weekend Brief" list, sender, and attributes, then adds
   `BREVO_API_KEY` as a GitHub secret.
4. Only after 2-3 are verified live: attach the `raceiq.crouchdevelopment.com` domain via the
   Cloudflare dashboard.
