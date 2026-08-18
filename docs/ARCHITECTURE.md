# RaceIQ Architecture

## System overview

```text
FastF1 (live data) --> analysis/raceiq/ (Python engine) --> data/generated/*.json (committed)
                                                                     |
                                                                     v
                                              apps/web (Next.js) reads JSON at build/request time
                                                                     |
                                                                     v
                                                        interactive dashboard + social card
```

RaceIQ deliberately keeps two runtimes: Python for analysis, TypeScript/React for presentation.
Nothing in `analysis/raceiq/` is ported to TypeScript, and nothing in `apps/web` recomputes a
metric -- it only renders what the engine already produced.

## Why analysis is not on-demand

The intended public frontend host is Cloudflare (see "Deployment architecture" below).
FastF1, pandas, NumPy, and matplotlib are not compatible with a standard Cloudflare Worker
runtime, and no hosted Python analysis service is currently verified or authorized for RaceIQ.

Given that constraint, this repository evaluated the options from the task brief:

1. **Precomputed JSON artifacts, committed during controlled generation** -- chosen for Phase 1.
2. A separately hosted Python analysis API -- not currently authorized; see `docs/ROADMAP.md`.
3. A scheduled/queued analysis worker on a Python-compatible platform -- not currently authorized.
4. A hybrid frontend that serves cached results and calls out for missing ones -- deferred until
   option 2 or 3 exists; there is nothing to call out to yet.

**Decision (recorded in `docs/DECISIONS.md`): Phase 1 uses option 1.** `scripts/generate_analysis.py`
runs the engine against a real FastF1 session in an environment with network access, validates the
output against the schema contract, and writes it to
`data/generated/raceiq/v{analysisVersion}/{year}/{event-slug}/{session}.json`. That file is
committed to the repository and is the cache. The frontend never calls FastF1 or the Python engine
at request time.

The application must never present this precomputed data as a live, on-demand analysis, and it
does not: every race report states its generation timestamp, and the demo/sample route is visibly
labeled and excluded from search indexing.

## The analysis contract

Defined once, enforced twice:

- Python: `analysis/raceiq/schemas.py` (`ANALYSIS_VERSION`, `validate_analysis()`)
- TypeScript: `apps/web/lib/schema.ts` (zod `raceAnalysisSchema`)

Both must be updated together when the contract changes, and `ANALYSIS_VERSION` must bump when a
change would alter the meaning of already-generated files. `apps/web/tests/schema.test.ts`
validates a real engine-generated fixture against the TypeScript schema as an integration check.

## Frontend data access

**Build-time static import, not runtime filesystem access.** `apps/web/scripts/build-data.mjs` is
a standalone Node.js script (never bundled into the app) that reads the committed
`data/generated/`, `data/race-manifest.json`, `data/fixtures/demo-race.json`, and `assets/cd-mark.png`
and writes them into app-owned JSON artifacts under `apps/web/data/*.json` (gitignored, regenerated
every build). `lib/raceData.ts` and `lib/raceManifest.ts` `import` those files directly
(`import generatedRacesData from "../data/generated-races.json"`) instead of reading anything with
`node:fs` at request time. Webpack/Next inlines a static `import` of a JSON module into the built
JS bundle, so the data ships as part of the code -- there is no path to resolve, no directory to
find, and no distinction between "works under `next start`" and "works inside a Workers isolate,"
because nothing is read from disk after the build step runs. `npm run generate:data` runs the
script; every other script that needs the data (`dev`, `build`, `lint`, `typecheck`, `test`,
`cf:build`, `cf:preview`, `cf:deploy`) has a matching `pre<script>` hook so it always runs first --
except CI's direct `npx eslint .` call, which bypasses `prelint`, so CI runs `generate:data`
explicitly as its own step (see `.github/workflows/ci.yml`, `deploy-cloudflare.yml`).

This replaced an earlier design (through 2026-08-17) where `raceData.ts`/`raceManifest.ts` read
`data/**` via `node:fs`, resolved relative to the monorepo root
(`path.resolve(process.cwd(), "..", "..")`), and `next.config.ts` set `outputFileTracingIncludes`
to copy `data/**` into the deployed function/Worker output. That worked under `next start`/`next
build` (a real Node.js process, where `process.cwd()` and the traced files are both real) but
silently produced zero data in the actual deployed Cloudflare Worker: Workers have no persistent
filesystem at request time, so `fs.readFileSync`/`fs.existsSync` against that path returned
nothing -- no thrown error, just empty arrays -- and the homepage, archive, and filters all
rendered empty. `outputFileTracingIncludes` copying the files into `.open-next/` never guaranteed
the *runtime* path inside the Worker resolved to them; it was necessary but not sufficient, and
nothing in this build environment's own toolchain caught that, because `next build`, browser
checks against `next start`, and even an HTTP-200-only post-deploy check all exercise a real
Node.js process or a status code, never the actual `workerd` runtime with a request-time
filesystem lookup. See `docs/DECISIONS.md` (2026-08-17) for the full incident writeup and
`scripts/verify-worker-runtime.mjs` (below) for the check that now exists specifically to catch
this failure class before it ships again.

- **Client bundling**: server-only modules must never be imported into a `"use client"`
  component's dependency graph. `lib/slug.ts` still exists to give client components
  (`SeasonRaceSelector`) a `slugify()` they can import instead of pulling in `lib/raceData.ts`.
- **Static generation**: `generateStaticParams` in `/race/[year]/[event]/page.tsx` enumerates every
  currently generated (real) analysis plus the one demo route, so the common case is served as a
  prebuilt static page. Unlike the old design, an unlisted path is no longer a special, riskier
  case: `dynamicParams = true` (the default) lets Next render it live from the same statically
  imported data with no filesystem access involved either way -- see "Static routing and the
  Cloudflare incremental cache" below for why the earlier `dynamicParams = false` guard actively
  broke production once the underlying filesystem risk it was written to prevent no longer existed.

## Social card (`opengraph-image`)

`apps/web/app/race/[year]/[event]/opengraph-image.tsx` uses `next/og`'s `ImageResponse` with
`export const runtime = "nodejs"`. It defines its own `generateStaticParams` (mirroring the
page's) and reads the Crouch Development mark from the same build-time static-import artifact
(`data/cd-mark.json`, a base64 data URI written by `scripts/build-data.mjs`) rather than
`node:fs`. No remaining runtime `fs` dependency anywhere in `apps/web` except `/api/subscribe`,
which doesn't touch `fs` at all.

## Static routing and the Cloudflare incremental cache

A second, independent production bug was found while fixing the one above, and is recorded here
because it's a different failure mode with the same root lesson: **don't depend on
runtime infrastructure this Worker doesn't have configured.**

`/race/[year]/[event]/page.tsx` had `export const dynamicParams = false` -- originally written to
force an upfront 404 for any path outside `generateStaticParams`, rather than let it fall through
to a dynamic render that (under the old `fs`-based `raceData.ts`) would have crashed trying to
read `data/**`. That reasoning no longer applies now that `resolveAnalysis()` is a static-imported
array lookup, safe for any input. But `dynamicParams = false` didn't just become unnecessary --
verifying the fix above against the real Workers runtime (`wrangler dev --local`, not `next
start`) found it was actively breaking every race report: all twenty routes, including ones
present in `generateStaticParams` and correctly prerendered at build time, returned **HTTP 404**.

**Root cause**, found by querying `wrangler dev`'s own local observability log
(`/cdn-cgi/local/explorer/api/local/observability/query`) for the actual server-side error rather
than guessing: `Error: Internal: NoFallbackError`, thrown from OpenNext's `handleRevalidate`. This
Worker has no R2/KV binding configured for OpenNext's incremental cache (see `wrangler.jsonc`), so
`@opennextjs/cloudflare` falls back to its default `"dummy"` incremental cache, whose `get()`
always reports a miss -- for *every* route, on *every* request, prerendered or not. For a plain
static page (`/`, `/archive`) a cache miss just means "render fresh," which works fine since
rendering is now filesystem-free. But for an SSG route declared `dynamicParams: false`, Next's own
server treats a cache miss as "this path was never actually generated," and refuses to fall back
to a live render -- by design, since `dynamicParams: false` is supposed to mean exactly that. The
sibling `opengraph-image.tsx` route also declares `dynamicParams: false` and was never affected,
because Next compiles a metadata image route through a different code path that isn't gated by the
page-revalidate cache lookup.

**Fix**: `/race/[year]/[event]/page.tsx` now declares `dynamicParams = true` (Next's own default;
the file makes it explicit and documents why). A request for any path -- listed in
`generateStaticParams` or not -- now always renders live from the same static-imported data if the
cache lookup misses, which it always will without a configured cache binding. The existing
"Analysis not yet generated" panel already renders correctly (HTTP 200) for a year/event
combination with no matching analysis, so behavior for genuinely unknown routes is unchanged; only
the *known, real* routes that were incorrectly 404ing are fixed. `app/race/[year]/[event]/not-found.tsx`
is now unreachable dead code (nothing calls `notFound()` in this route and `dynamicParams: true`
means Next never renders a segment's `not-found.tsx` automatically) -- left in place rather than
deleted, since it's a standard Next.js special file and removing it is not required by this fix.
See `docs/DECISIONS.md` (2026-08-17) for the incident writeup and
`scripts/verify-worker-runtime.mjs`, which now asserts every spot-checked race route returns 200
with real content against the actual Workers runtime, not just a status code against `next start`.

## Deployment architecture

- **Frontend**: Cloudflare Workers via the `@opennextjs/cloudflare` adapter (`wrangler.jsonc`,
  `open-next.config.ts`, `npm run cf:build` / `cf:deploy` in `apps/web`), Worker name `raceiq-web`,
  target domain `raceiq.crouchdevelopment.com`. **Live** at
  `https://raceiq-web.bryan-7df.workers.dev`, deployed automatically by
  `.github/workflows/deploy-cloudflare.yml` on every push to `main`. See `docs/CURRENT_STATE.md`
  for the current verified deployment state. Attaching the custom domain remains a separate,
  deliberate step this repository's deploy workflow does not perform automatically (it only
  reaches the Worker's `*.workers.dev` subdomain).
  - Two real bugs were found and fixed getting the Cloudflare build to succeed, both from this
    being a monorepo (the Next.js app lives in `apps/web`, not the repo root): `output:
    "standalone"` was missing from `next.config.ts` (required by `@opennextjs/cloudflare`, or its
    build step can't find `.next/standalone` at all); and an earlier `outputFileTracingRoot`
    override pointed at the monorepo root, which caused `@opennextjs/cloudflare`'s own monorepo
    auto-detection to nest the standalone output under `apps/web/.next/...` while its manifest
    reader looked for the unnested path -- removing the override let both tools independently
    agree that `apps/web` (which has its own lockfile) is the root. See `docs/DECISIONS.md`
    (2026-08-16).
- **Analysis generation**: run manually (or via a future guarded CI job) in an environment with
  network access to FastF1's data sources (`livetiming.formula1.com`, `api.jolpi.ca`/Ergast
  successor). This sandboxed build environment's egress policy denies both hosts (verified via
  `curl $HTTPS_PROXY/__agentproxy/status`, `connect_rejected` / 403), so no real analysis could be
  generated here -- generation happens on Bryan's machine instead, via
  `scripts\build-race-library.ps1` (see "Race Library Engine" below and `docs/CURRENT_STATE.md`).
- **Lead capture**: Next.js Route Handler (`apps/web/app/api/subscribe/route.ts`) calling Brevo's
  API server-side. `BREVO_API_KEY` is read at request time, so on Cloudflare it must be a Worker
  runtime secret (`wrangler secret put`), not a build-time env var -- `.github/workflows/
  deploy-cloudflare.yml` syncs it from the `BREVO_API_KEY` GitHub secret automatically once that
  secret exists. Neither the secret nor a verified Brevo list ID exist yet -- the route fails
  safely (503, no partial side effects) until they're configured.

## Race Library Engine (curated generation pipeline)

Generating races one at a time (`python scripts/generate_analysis.py <year> <event>`) still works
and is what actually calls the engine, but choosing *which* races to generate, and doing it
repeatably on a fresh machine, used to require reading this file and improvising. The Race Library
Engine is the automation layer on top of that, added without touching `analysis/raceiq/` or the
JSON contract:

```text
data/race-manifest.json  (curated list: year, event query, displayName, category, featured, description)
        |
        v
scripts/generate_batch.py  (resolves each event via fastf1.get_event, skips valid existing files,
        |                    continues past failures, prints a generated/skipped/failed summary)
        v
scripts/generate_analysis.py  (unchanged -- one real session -> one committed JSON artifact)
        |
        v
scripts/validate_generated.py  (re-checks every committed file against raceiq.schemas.validate_analysis)
```

`scripts\build-race-library.ps1` is the Windows entry point that wraps all of this plus environment
setup and the full check suite: create/reuse `.venv`, install `analysis/requirements.txt`,
create/reuse `cache/`, run the manifest-driven generation (`-Force`, or `-Year`/`-Event` for one
race), run JSON validation, run `pytest`, then run the frontend's test/typecheck/lint/build --
printing one final per-stage PASS/FAIL/SKIP report. See `docs/CURRENT_STATE.md` for the exact
command and what needs to be installed first.

**Event resolution, not guessing.** A manifest entry's `event` field is a FastF1 lookup query
(e.g. `"Monaco"`), not a promise that FastF1's official event name is exactly that string.
`scripts/generate_batch.py` calls `fastf1.get_event(year, event)` -- a lightweight, schedule-only
lookup -- *before* attempting a full session load, so a bad or unresolvable identifier fails fast
with FastF1's own reason and the batch moves on to the next race, rather than guessing a slug and
silently writing to the wrong path or crashing the run. The manifest deliberately does not store a
predicted output slug: FastF1 resolves the real one at generation time, and a stored guess that
turned out wrong would either mask itself or need constant upkeep. If a generation run reports
success but the expected output file isn't where the script predicted, that specific race is
reported as failed with an explicit message pointing at the mismatch -- not silently accepted.

**Frontend join, same principle.** `apps/web/lib/raceManifest.ts::findManifestEntry` attaches a
manifest entry's editorial metadata (category, featured flag, description) to a real generated
race by matching `(year, the actual FastF1-resolved event.name)` -- never a predicted slug -- so a
race whose official name turns out to differ from what was assumed when the manifest entry was
written simply doesn't get a badge yet, instead of attaching the wrong one. This is additive:
`RaceLibrary` renders identically for any race with no manifest match. One real gap this join had
until Phase 2's verification pass: a plain substring check silently fails when the manifest query
is a country name but FastF1's real EventName uses the demonym (`"Germany"` vs. `"German Grand
Prix"`) -- fixed with a small `EVENT_NAME_ALIASES` table, verified against all 20 real committed
races, not guessed. See `docs/DECISIONS.md`.

## Frontend composition (Phase 2 showcase rebuild)

The data flow above is unchanged by Phase 2 -- this section is about how `apps/web` presents that
same data. Two pages consume the same building blocks:

```text
lib/raceLibraryData.ts (server-only: joins listGeneratedAnalyses() + raceManifest.ts)
        |
        +--> app/page.tsx        (Hero, FeaturedRaceSpotlight, RaceLibrary, business CTA)
        |
        +--> app/archive/page.tsx (RaceLibrary as its own full page, same component)

app/race/[year]/[event]/page.tsx
        +--> WhatDecidedTheRace (SummaryCards, restyled + lib/raceInsight.ts::getTakeaways)
        +--> four ChartCard sections (unchanged chart components)
        +--> CollapsibleSection (Evidence & Methodology, collapsed by default)
```

`lib/raceInsight.ts` holds the pure, testable editorial logic (`getPrimaryInsight`,
`getTakeaways`, `pickFeaturedRace`, `findEvidence`) -- it imports nothing server-only (no
`node:fs`), so it's safe to import from `RaceLibrary.tsx`, a client component, without pulling
`fs` into the browser bundle. Server-only data assembly (`raceLibraryData.ts`, which does import
`raceData.ts` and `raceManifest.ts`) is a separate file for exactly that reason -- the same
`lib/slug.ts` pattern this repository already established for `raceData.ts` vs. client components.

**RaceIQ Weekend Brief is hidden, not removed.** `components/WeekendBriefForm.tsx` and
`app/api/subscribe/route.ts` are unchanged and still present; neither `app/page.tsx` nor
`app/race/[year]/[event]/page.tsx` renders `WeekendBriefForm` anymore. Re-enabling it later is a
matter of adding the component back to those two pages once Bryan explicitly decides to reconnect
Brevo -- not a rebuild.

**No new runtime dependencies.** The hero's entrance motion and the racing-line shimmer
(`RacingLineBackdrop.tsx`) are CSS-only (`app/globals.css`, guarded by
`prefers-reduced-motion`) -- no animation library was added. `CollapsibleSection` uses a native
`<details>`/`<summary>` element, not a new disclosure component or dependency.

## Caching

- **FastF1 session cache**: local disk cache (`cache/`, gitignored) used only during generation,
  never shipped.
- **RaceIQ analysis cache**: the committed JSON file itself, keyed by
  `raceiq/v{analysisVersion}/{year}/{event-slug}/{session}`. Regeneration is deliberate (rerun the
  script), not automatic. A change to `ANALYSIS_VERSION` is what should trigger regeneration of
  existing files -- old versioned files remain valid and are not silently reinterpreted.
- **Frontend rendering**: static generation for known routes at build time; a live render from the
  same build-time static-imported data on any cache miss (which is every request, since this
  Worker has no incremental-cache binding configured -- see "Static routing and the Cloudflare
  incremental cache" above), including for routes not in `generateStaticParams`.

## Social Content Engine (Phase 3)

A build-time-only Python tool, independent of the Next.js app, that turns an already-committed
race analysis into a social-media content package. Reuses the analysis contract; never talks to
the frontend, FastF1, or an LLM.

```text
data/generated/raceiq/v{version}/{year}/{eventSlug}/R.json  (committed, already schema-valid)
data/race-manifest.json                                     (committed editorial metadata)
        |
        v
scripts/generate_race_content.py  (resolves year+event query -> analysis file, mirroring
        |                          raceManifest.ts's alias/substring rule; mirrors
        |                          headlineEligibility.ts's MIN_HEADLINE_SAMPLE_RATIO filter;
        |                          never claims a driver "won" -- the contract has no results field)
        v
content/generated/{year}-{eventSlug}/
    linkedin-personal.md, linkedin-data.md, instagram-caption.md,
    x-thread.md, short-video-outline.md          (deterministic string templates)
    insight-card-pace.png, insight-card-consistency.png,
    insight-card-closing.png                     (matplotlib, RaceIQ hex palette, no logos)
    content-manifest.json                        (every claim mapped to its exact source field)
```

`scripts\build-race-content.ps1` is the Windows entry point (mirrors `build-race-library.ps1`'s
venv-management convention). `scripts/generate_launch_content.py` imports the same fact-building
functions (not duplicated) to produce `content/launch/` -- a one-time launch campaign for a single
selected race, with its own narrative templates.

**Feeding the frontend back**: `apps/web/scripts/build-data.mjs` scans
`content/generated/*/content-manifest.json`, copies each race's `insight-card-pace.png` into
`apps/web/public/content-cards/{year}/{eventSlug}/` (a plain static asset, gitignored, regenerated
every build), and writes `apps/web/data/content-cards.json` listing which races have one.
`apps/web/lib/contentCards.ts` static-imports that list (same no-runtime-fs architecture as the
rest of `apps/web/data/`) so `components/ShareBar.tsx`'s "Download graphic" control can check
availability without touching the filesystem at request time.

**On-site sharing** (`components/ShareBar.tsx`, race report pages only): copy-link (clipboard),
LinkedIn and X share-intent links (`https://www.linkedin.com/sharing/share-offsite/?url=...`,
`https://twitter.com/intent/tweet?...`), and the conditional download link above. All four are
plain client-side links/clipboard calls -- no auth, no social platform API calls, no server-side
posting.

**Analytics**: no dedicated event pipeline. Cloudflare Web Analytics (pageviews/performance only,
enabled via the Cloudflare dashboard, not this repository) is the whole analytics surface -- see
`docs/GROWTH.md` for exactly what that does and does not cover, and why nothing was built to
capture filter/CTA/share-click events (Cloudflare Web Analytics has no custom-event support, and
this repository's constraints rule out a substitute).

## Testing strategy

- Python: `analysis/tests/` -- synthetic fixtures for metric math, availability rules, schema
  validation, and one full `engine.run_analysis()` integration test against a monkeypatched
  FastF1 session (no live network call in CI).
- Frontend: `apps/web/tests/` -- component rendering (selector, forms, chart container, badges,
  `Hero`, `CollapsibleSection`, `WhatDecidedTheRace`), data resolution (`resolveAnalysis`),
  editorial logic (`raceInsight.test.ts`), the `RaceLibrary` filter behavior (season, category,
  driver, featured, search, and that no season without a real race is ever offered), the manifest
  demonym-alias join (`raceManifest.test.ts`), metadata generation, the subscribe route's
  validation and fail-safe behavior, and a schema-contract integration test against a real
  engine-generated fixture (`data/fixtures/demo-race.json`).
- Neither suite depends on a live external data request, per the requirement that a live request
  must never be the only automated test.
