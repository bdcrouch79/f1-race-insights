# RaceIQ Current State

Last verified: 2026-08-17

## Implemented

### P0 fix: deployed Worker rendered zero races (2026-08-17)

Bryan reported the live Worker showed an empty hero, no featured race, no cards, and empty
filters, despite all 21 JSON files being committed and CI-validated. Confirmed and fixed the
architecture, not the symptom -- see `docs/DECISIONS.md` for the full root-cause writeup and
`docs/ARCHITECTURE.md` ("Frontend data access", "Static routing and the Cloudflare incremental
cache") for the mechanism. Summary:

1. **Runtime `node:fs` reads against `process.cwd()`-derived paths silently returned nothing
   inside the deployed Cloudflare Worker** (no persistent filesystem at request time -- reproduced
   locally via `wrangler dev --local`, not just inferred). Fixed by eliminating runtime filesystem
   access entirely: `apps/web/scripts/build-data.mjs` (new) transforms the committed manifest and
   generated analyses into `apps/web/data/*.json` at build time, and `lib/raceData.ts`,
   `lib/raceManifest.ts`, and `opengraph-image.tsx` now `import` those files as static JSON
   modules -- inlined into the JS bundle by webpack, zero runtime filesystem dependency on any
   platform. `next.config.ts`'s `outputFileTracingIncludes` was removed as no longer needed.
2. **A second, independent, pre-existing bug found while verifying the first fix against the real
   Workers runtime**: every race report page 404'd (while its OG image route worked), because
   `dynamicParams = false` combined with this Worker's unconfigured incremental cache made Next
   throw `NoFallbackError` on every request. Fixed by setting `dynamicParams = true` -- safe now
   that rendering any path live is just a static-imported array lookup, not a filesystem read.
3. **New regression coverage**: `apps/web/tests/productionDataRegression.test.ts` (vitest, exercises
   real production code against real build data) and `apps/web/scripts/verify-worker-runtime.mjs`
   (`npm run verify:worker` -- boots the actual `wrangler dev` Workers runtime and checks real
   content on the homepage, archive, sitemap, and spot-checked race reports + OG images). Both are
   now wired into `.github/workflows/ci.yml` and `deploy-cloudflare.yml`. The deploy workflow's
   post-deploy check was also rewritten from a status-code-only check (previously gated behind an
   unset repo variable, so it silently never ran) to check the live URL's response body for real
   race cards.

**Root cause for documentation**: local `next start`/browser verification and even the previous
deploy workflow's HTTP-status-only check never reproduced the Cloudflare Worker's actual runtime
filesystem layout (no persistent filesystem) or its actual cache behavior (no incremental-cache
binding configured, so every lookup misses). Both bugs in this entry were only found by running
the real `workerd`/`wrangler dev --local` runtime directly and inspecting its own request traces
and console logs -- not by any check that used `next start`, `next build`, or a bare curl status
code. `scripts/verify-worker-runtime.mjs` now makes that the standard local and CI check going
forward.

**Verified so far**: JSON validation (21/21), Python tests (29 passed), frontend typecheck/lint/
`npm run test` (76 passed), `npm run build`, `npm run cf:build`, and `npm run verify:worker`
against the real local Workers runtime -- all passing, including every race report and OG image
route spot-checked. **Not yet verified**: the actual deployed `workers.dev` URL after this change
merges and redeploys -- see "Exact next action" below. Per explicit instruction, this fix is not
considered complete and Bryan OS is not updated until that direct check happens.

### Phase 2: RaceIQ Showcase Rebuild

Transforms RaceIQ from a technical report viewer into a visually-led showcase, without touching
the Python engine, the analysis contract, generated data, or the Cloudflare deployment path.

- **New homepage** (`apps/web/app/page.tsx`): a cinematic hero (`components/Hero.tsx`,
  `components/RacingLineBackdrop.tsx` -- an abstract SVG motif, no logos or trademarked graphics)
  with the exact required message ("The finishing order tells you who won. RaceIQ shows you how
  the race was won."), one featured real race shown with its actual generated metrics
  (`components/FeaturedRaceSpotlight.tsx`), the full Legendary Race Library, and a short Crouch
  Development tie-in with one CTA. The old dropdown-first selector (`SeasonRaceSelector`), the
  "How it works" grid, and the long "Why this exists" paragraph are gone from the homepage.
- **Legendary Race Library** (`components/RaceLibrary.tsx`, replacing `ArchiveGrid.tsx`): every
  real generated race, filterable by season, editorial category, driver, and featured status.
  Used identically on the homepage (`#library` section) and `/archive` (now titled "Legendary
  Race Library") -- one filtering implementation, not two. Only ever receives already-generated
  races; there is no on-demand generation and no empty season is ever offered. Each card shows the
  race name and year, its editorial category, circuit, one evidence-backed insight
  (`lib/raceInsight.ts::getPrimaryInsight`), featured status, and a direct report link.
- **"What Decided The Race"** (`components/WhatDecidedTheRace.tsx`, race report pages): leads
  every report with the four headline stats (restyled, more prominent `SummaryCards`) and up to
  three evidence-backed takeaways (`lib/raceInsight.ts::getTakeaways`). Both are generated only
  from `analysis.summary` and `analysis.evidence` -- the same verified metrics the charts render,
  never a new computation. The charts follow under a plain "The Evidence" heading; Evidence &
  Methodology detail is now collapsed by default (`components/CollapsibleSection.tsx`, a native
  `<details>`), present but visually secondary.
- **RaceIQ Weekend Brief hidden from the public experience.** `WeekendBriefForm` is no longer
  rendered on the homepage or race report pages. The component, the `/api/subscribe` route, and
  the Brevo integration code are untouched and still in the repository -- nothing was deleted, it
  is just not shown, pending an explicit decision to reconnect it (see `docs/DECISIONS.md`).
- **Accurate language throughout.** "Analyze a Race" (implying arbitrary/on-demand generation) is
  replaced with "Explore Race Intelligence" in the header CTA and hero; "Archive" is relabeled
  "Race Library" in navigation. No page claims a visitor can generate or analyze an arbitrary race.
- **A real join bug found and fixed**: `apps/web/lib/raceManifest.ts`'s race-to-manifest join used
  a plain substring check, which silently failed for 7 of the 20 real races because a manifest
  query is a country name ("Germany") but FastF1's real EventName often uses the demonym
  ("German Grand Prix") -- "germany" is not a substring of "german". Fixed with a small, verified
  alias table (`EVENT_NAME_ALIASES`); see `docs/DECISIONS.md`. Caught by comparing the "Featured
  only" filter's rendered count (6) against the manifest's actual featured count (8) during
  Playwright verification, not assumed correct from code review alone.
- **Featured-race spotlight chart fixed the same way the social card already was**: the
  homepage's mini pace-chart preview initially showed every driver's raw, unfiltered ranking --
  exactly the decontextualized-chart risk `docs/DECISIONS.md` (2026-08-16) already fixed for the
  OG image. Reused the existing `filterEligibleForHeadline` helper (no new logic) so the spotlight
  chart only shows headline-eligible drivers with gaps recomputed relative to the eligible leader.
- **Design**: dark, cinematic palette (unchanged design tokens), Oswald display type pushed
  harder for scale/hierarchy, subtle CSS-only entrance motion and a racing-line shimmer
  (`prefers-reduced-motion` respected, no new dependency -- no motion library was added).
  Mobile verified independently designed (stacked stat cards, full-width CTAs, touch-sized
  filters), not a shrunk desktop layout.

### Phase 1: Race Library Engine (local, Windows entry point)

- A version-controlled curated manifest of 20 notable races (`data/race-manifest.json`,
  2018-2024, each with a FastF1 event query, display name, editorial category, featured flag, and
  a short neutral, publicly sourced description -- see `docs/DECISIONS.md`) drives generation
  instead of a hardcoded list. `scripts/generate_batch.py` resolves each entry against FastF1's
  own schedule (`fastf1.get_event`) before attempting a full session load, so a bad identifier
  fails fast with FastF1's own reason instead of downloading anything; skips races that already
  have a schema-valid committed analysis unless `--force` is passed; supports a single race via
  `--year`/`--event`; never lets one race's failure stop the batch; and prints a final
  generated/skipped/failed summary. `scripts/validate_generated.py` re-validates every committed
  file against the existing `raceiq.schemas.validate_analysis` contract. None of this touches
  `analysis/raceiq/` (the engine) or its contract.
  `scripts\build-race-library.ps1` is the Windows entry point: creates/reuses `.venv`, installs
  `analysis/requirements.txt`, creates/reuses `cache/`, runs the manifest-driven generation, runs
  JSON validation, runs `pytest`, then runs the frontend's test/typecheck/lint/build -- and prints
  one final PASS/FAIL/SKIP report per stage.
- **All 20 curated races are real, generated, and committed** (`data/generated/raceiq/v1.1.1/`).
  Bryan ran `scripts\build-race-library.ps1` on a network-unrestricted machine on 2026-08-17;
  every manifest entry resolved and generated successfully. This was previously blocked in any
  sandboxed environment (no FastF1 network access) -- see "Real data status" below.

### Analysis engine and contract (unchanged by Phase 1 or Phase 2)

- **Python analysis engine** (`analysis/raceiq/`): `engine.py`, `metrics.py`, `narrative.py`,
  `schemas.py`, `availability.py`. `ANALYSIS_VERSION = "1.1.1"`. Original `main.py` and root
  `requirements.txt` are untouched and still work standalone.
- **Headline-eligibility filter** (`narrative.py`, added in v1.1.0): the four `summary` headline
  picks require a driver's quick-lap sample to be at least half the field's largest before they're
  eligible. Real data surfaced this: Monaco 2024's Logan Sargeant (14 quick laps before an early
  incident, field high ~50) topped the raw average-pace and degradation-decline rankings.
- **Decline-sign fix** (`narrative.py`, v1.1.1): `largestPaceDeclineDriver` only populates when the
  pick's delta is actually positive (a genuine slowdown), not the least-bad improvement.
- **Social-card and spotlight-chart consistency fix** (`apps/web/lib/headlineEligibility.ts`,
  frontend-only): any surface that independently re-derives a "top N" from the raw `paceRanking`
  (the OG image, and now the homepage spotlight chart) applies the same eligibility filter and
  recomputes gaps relative to the eligible leader.
- **Team-color identity swatches**: real per-season team colors from FastF1's own color mapping,
  never a team logo.

## Verified

- `cd analysis && python3 -m pytest -q` -- 29 passed.
- `python scripts/validate_generated.py` -- 21/21 committed JSON files valid (all 20 real races
  plus the demo fixture) against `raceiq.schemas.validate_analysis`.
- `cd apps/web && npm run typecheck` -- passes.
- `cd apps/web && npx eslint .` -- passes, zero messages (including the OG image route; no
  `<img>`-element warning was actually emitted in this build to "treat as understood" -- confirmed
  via `eslint --format=json`, not assumed).
- `cd apps/web && npm run test` -- 71 passed across 16 files: the existing suite plus new coverage
  for `lib/raceInsight.ts` (insight/takeaway generation, featured-race selection),
  `components/RaceLibrary.tsx` (season/category/driver/featured/search filtering, including that
  the season list never includes a season with no real race), `components/WhatDecidedTheRace.tsx`,
  `components/CollapsibleSection.tsx`, `components/Hero.tsx` (locks in the exact required hero
  copy and that no "generate"/"analyze a race" language is present), and a regression test for the
  manifest demonym-alias join fix.
- `cd apps/web && npm run build` -- production build succeeds; all 20 real race routes and their
  OG image routes statically generated (`/race/[year]/[event]` and
  `/race/[year]/[event]/opengraph-image`, `● (SSG)`), alongside `/`, `/archive`, `/methodology`,
  `/about`, `/sitemap.xml`, `/robots.txt`.
- `cd apps/web && npm run cf:build` -- succeeds; verified `data/race-manifest.json` and
  `data/generated/**` are both present in `.open-next/data/` (the Cloudflare bundle), so the
  Worker can read them at request time exactly like the existing `data/generated` trace.
- **Browser verification** (Playwright, desktop 1440x900 and mobile 390x844, against `next start`
  serving the real production build): homepage, `/archive`, and three real race reports (2024
  Monaco, 2018 Germany -- a genuine pace-decline race, 2021 Abu Dhabi -- a title decider) all
  rendered with zero browser console errors at both sizes. Confirmed: the hero message and CTA
  text are exact; zero "Weekend Brief" mentions anywhere in the public flow; the Featured-only
  filter returns exactly 8 cards (the manifest's real featured count, after the join fix above);
  the season filter only ever lists seasons with a real race; the archive page renders all 20
  cards; "What Decided The Race" renders on every report; Evidence & Methodology renders collapsed
  (`open` attribute absent) by default; the OG image route returns `200 image/png`; the sitemap
  returns `200` with 24 URLs (4 static pages + 20 real races); robots returns `200`. Screenshots
  reviewed directly, not just asserted programmatically -- this is how the manifest-join bug and
  the spotlight chart's unfiltered-driver bug (see above) were actually found.

## Race Library Engine: how to run it

```powershell
.\scripts\build-race-library.ps1              # generate every manifest race not already committed
.\scripts\build-race-library.ps1 -Year 2024 -Event Monaco   # one race
.\scripts\build-race-library.ps1 -Force        # regenerate every manifest race from scratch
```

Requires Python 3.11+ and Node.js 22 on `PATH`, and real network access to FastF1's data sources
for the generation step. Generates into `data/generated/raceiq/v1.1.1/<year>/<event
slug>/R.json` -- review with `git status`/`git diff`, then commit; the script never commits
anything itself.

## Real data status

**All 20 curated manifest races are real, generated, and committed** under
`data/generated/raceiq/v1.1.1/`, generated on Bryan's machine (network-unrestricted) via
`scripts\build-race-library.ps1` on 2026-08-17. 2024 Monaco Grand Prix remains the
most-scrutinized file (confirmed correct after three rounds of fixes, each caught by actually
reading the output rather than trusting the arithmetic -- see the Phase 1 entries in
`docs/DECISIONS.md` for the full history: Sargeant's unrepresentative sample, the decline-sign
bug, and the social card's unfiltered bar chart). The other 19 races generated cleanly against the
already-fixed v1.1.1 engine and were spot-checked in the browser during Phase 2 verification
(headline text, warnings, and chart rendering all internally consistent for every race checked).

## Deployment state

- **Frontend provider**: Cloudflare Workers, Worker `raceiq-web`. **Live** at
  `https://raceiq-web.bryan-7df.workers.dev` -- deployed automatically by
  `.github/workflows/deploy-cloudflare.yml` on push to `main`. This Phase 2 change was merged to
  `main` (PR #1) on 2026-08-17, which triggered workflow run `31988885854`: `npm run
  typecheck`/`eslint`/`test`/`cf:build` all passed on GitHub's own runner (independent of this
  session's local verification), then `Deploy to Cloudflare Workers` succeeded and produced a new
  Worker version (`Current Version ID: 8618a611-fc56-4bc4-9406-5cf1d5652a4a`, distinct from Phase
  1's `87ae1221-...`) at the URL above. **This session could not directly curl or browse that live
  URL to confirm the served HTML** -- this sandbox's egress policy blocks `*.workers.dev`, the
  same class of restriction already documented here for FastF1's data hosts. The deploy pipeline's
  own success and the new version ID are real evidence that the new build is live; a direct
  browser check of the public URL is the one verification step only Bryan (or a
  network-unrestricted session) can complete. **This description predates the 2026-08-17 P0 fix**
  (see above) -- that fix has not yet merged/redeployed as of this writing, so the live Worker at
  this URL is still the broken (zero-races) build until the P0 fix's own deploy completes and is
  verified per "Exact next action" item 4 below.
- **Production domain**: none attached yet (target: `raceiq.crouchdevelopment.com`; attaching it
  is a separate, deliberate step in the Cloudflare dashboard, not performed by the deploy
  workflow or by this change).
- **Analysis provider**: none (precomputed artifacts committed to this repository).
- **Email**: `BREVO_API_KEY` is not configured, so `/api/subscribe` still fails safely with HTTP
  503 if called directly. This is now moot for real visitors in the default flow -- the Weekend
  Brief form is not rendered anywhere in Phase 2's public UI (see above).

## Bryan OS registration

- Registered `raceiq` in `bdc-os/registry/apps.yaml` as an evolution of
  `bdcrouch79/f1-race-insights`.
- `bash scripts/check-control-plane.sh` was run against `bdc-os` after each update: 0 errors.

## Exact next action

1. ~~Generate and commit the curated race library.~~ Done -- all 20 races are real and committed.
2. ~~Deploy the frontend.~~ Done -- `raceiq-web` is live on `*.workers.dev` and auto-deploys on
   push to `main`.
3. ~~Rebuild the showcase experience (Phase 2).~~ Done -- see above.
4. **Manually verify the deployed `https://raceiq-web.bryan-7df.workers.dev` URL directly** after
   this P0 fix merges and `deploy-cloudflare.yml` redeploys: hero shows 20 races, a featured race,
   20 race cards, populated season/category/driver filters, at least three real race reports return
   200 with content, the archive is populated, an OG image route returns 200, and the sitemap lists
   every race URL. This sandbox's egress policy blocks `*.workers.dev` (same restriction already
   documented for FastF1's hosts), so this session cannot complete this step itself -- it requires
   Bryan or a network-unrestricted session. **This fix is not considered complete until this check
   happens** -- see `docs/DECISIONS.md` (2026-08-17).
5. Attach the `raceiq.crouchdevelopment.com` custom domain once Bryan is ready for it to be the
   public-facing URL (Cloudflare dashboard: the Worker's Settings -> Domains & Routes -> Add
   Custom Domain). Not done as part of this change -- it's a deliberate, separate step per
   `docs/ARCHITECTURE.md`.
6. When Bryan explicitly decides to resume the Weekend Brief: create the Brevo list, sender, and
   attributes; add `BREVO_API_KEY` as a GitHub secret; and re-render `WeekendBriefForm` in a
   follow-up change. Not started -- out of scope for Phase 2 by explicit instruction.
