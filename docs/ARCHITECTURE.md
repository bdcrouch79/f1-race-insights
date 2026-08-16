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

`apps/web/lib/raceData.ts` reads `data/generated/` and `data/fixtures/` from the filesystem via
`node:fs`, resolved relative to the monorepo root (`path.resolve(process.cwd(), "..", "..")`).
This only works when the full repository checkout is present at build/request time. Two
consequences are handled explicitly:

- **Client bundling**: server-only modules (`fs`, `path`) must never be imported into a `"use
  client"` component's dependency graph. `lib/slug.ts` exists specifically to give client
  components (`SeasonRaceSelector`) a filesystem-free `slugify()` they can import instead of
  pulling in `lib/raceData.ts`.
- **Serverless/edge bundling**: `next.config.ts` sets `outputFileTracingIncludes` so `/`,
  `/archive`, and `/race/[year]/[event]` trace `data/**` into their deployed function/worker
  output. Without this, a dynamically-rendered (non-statically generated) request for those routes
  would not find the data directory on a serverless/edge platform even though it works in local
  `next dev`. Deliberately does **not** also set `outputFileTracingRoot` to the monorepo root:
  `apps/web` has its own `package-lock.json`, so both Next and `@opennextjs/cloudflare` already
  treat it as its own tracing root; overriding it broke the Cloudflare build outright (see below).
  Verified: `.open-next/data/generated/raceiq/...` actually contains the real Monaco JSON after a
  `cf:build`.
- **Static generation**: `generateStaticParams` in `/race/[year]/[event]/page.tsx` enumerates every
  currently generated (real) analysis plus the one demo route, so the common case is served as a
  prebuilt static page regardless of the runtime's filesystem access.

## Social card (`opengraph-image`)

`apps/web/app/race/[year]/[event]/opengraph-image.tsx` uses `next/og`'s `ImageResponse` with
`export const runtime = "nodejs"`. It also defines its own `generateStaticParams` (mirroring the
page's), which is the fix for the risk this section used to flag: without it, the image is
generated on demand at request time, needing the same `data/**` filesystem access as the page --
fine on Node.js runtimes, but Cloudflare Workers have no real filesystem at request time. With
`generateStaticParams`, Next bakes the PNG as a static file at build time instead, for every route
this app actually ships (verified: `next build` shows `● (SSG)` for
`/race/[year]/[event]/opengraph-image`, not `ƒ (Dynamic)`). No remaining runtime `fs` dependency
anywhere except `/api/subscribe`, which doesn't touch `fs` at all.

## Deployment architecture

- **Frontend**: Cloudflare Workers via the `@opennextjs/cloudflare` adapter (`wrangler.jsonc`,
  `open-next.config.ts`, `npm run cf:build` / `cf:deploy` in `apps/web`), Worker name `raceiq-web`,
  target domain `raceiq.crouchdevelopment.com`. **Build verified working end to end** (`npm run
  cf:build` succeeds; `npx wrangler deploy --dry-run` reads and validates the full asset bundle,
  62 files, ~8.6 MB). **Not yet actually deployed** -- no Cloudflare API token exists in this
  repository's secrets yet. See `docs/CURRENT_STATE.md` for the exact remaining steps. Attaching
  the custom domain is a separate, deliberate step this repository's deploy workflow does not
  perform automatically (it only reaches the Worker's `*.workers.dev` subdomain).
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
  generated here -- generation happens on Bryan's machine instead; see `docs/CURRENT_STATE.md`.
- **Lead capture**: Next.js Route Handler (`apps/web/app/api/subscribe/route.ts`) calling Brevo's
  API server-side. `BREVO_API_KEY` is read at request time, so on Cloudflare it must be a Worker
  runtime secret (`wrangler secret put`), not a build-time env var -- `.github/workflows/
  deploy-cloudflare.yml` syncs it from the `BREVO_API_KEY` GitHub secret automatically once that
  secret exists. Neither the secret nor a verified Brevo list ID exist yet -- the route fails
  safely (503, no partial side effects) until they're configured.

## Caching

- **FastF1 session cache**: local disk cache (`cache/`, gitignored) used only during generation,
  never shipped.
- **RaceIQ analysis cache**: the committed JSON file itself, keyed by
  `raceiq/v{analysisVersion}/{year}/{event-slug}/{session}`. Regeneration is deliberate (rerun the
  script), not automatic. A change to `ANALYSIS_VERSION` is what should trigger regeneration of
  existing files -- old versioned files remain valid and are not silently reinterpreted.
- **Frontend rendering**: static generation for known routes; dynamic fallback (still reading the
  same committed JSON) for anything not yet in `generateStaticParams`.

## Testing strategy

- Python: `analysis/tests/` -- synthetic fixtures for metric math, availability rules, schema
  validation, and one full `engine.run_analysis()` integration test against a monkeypatched
  FastF1 session (no live network call in CI).
- Frontend: `apps/web/tests/` -- component rendering (selector, forms, chart container, badges),
  data resolution (`resolveAnalysis`), metadata generation, the subscribe route's validation and
  fail-safe behavior, and a schema-contract integration test against a real engine-generated
  fixture (`data/fixtures/demo-race.json`, produced by `scripts/generate_demo_fixture.py`).
- Neither suite depends on a live external data request, per the requirement that a live request
  must never be the only automated test.
