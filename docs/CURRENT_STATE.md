# RaceIQ Current State

Last verified: 2026-08-15

## Implemented

- **Python analysis engine** (`analysis/raceiq/`): `engine.py`, `metrics.py`, `narrative.py`,
  `schemas.py`, `availability.py`. Refactored from the original `main.py` calculations into
  callable, parameter-validated, metric-level-fault-tolerant functions that return the versioned
  JSON contract (`ANALYSIS_VERSION = "1.0.0"`). Original `main.py` and root `requirements.txt` are
  untouched and still work standalone.
- **Generation scripts**: `scripts/generate_analysis.py` (real FastF1 session -> committed JSON)
  and `scripts/generate_demo_fixture.py` (synthetic fixture for interface verification).
- **Next.js frontend** (`apps/web`): homepage, `/race/[year]/[event]`, `/archive`, `/methodology`,
  `/about`, dynamic OG social card, sitemap/robots, RaceIQ Weekend Brief signup form and API route,
  RaceIQ visual design system (palette, typography, chart components via Apache ECharts).
- **Required Bryan OS repository documents**: this file plus `AGENTS.md`, `docs/PRODUCT.md`,
  `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/DATABASE_TARGET.md`,
  `docs/OFFER.md`, `docs/GROWTH.md`, `docs/METHODOLOGY.md`, `docs/DATA_AVAILABILITY.md`,
  `docs/CONTENT_ENGINE.md`, `.github/PULL_REQUEST_TEMPLATE.md`.

## Verified

- `cd analysis && python3 -m pytest -q` -- 22 passed (metrics math against hand-calculated
  synthetic fixtures, availability rules, schema validation, one full `engine.run_analysis()`
  integration test against a monkeypatched FastF1 session).
- `cd apps/web && npm run typecheck` -- passes.
- `cd apps/web && npx eslint .` -- passes (no errors).
- `cd apps/web && npm run test` -- 31 passed across 9 files (components, data resolution, format
  helpers, metadata generation, subscribe-route validation/fail-safe behavior, and a schema
  contract test against a real engine-generated fixture).
- `cd apps/web && npm run build` -- production build succeeds; `/race/2026/raceiq-demo-grand-prix`
  statically generated.
- Manual browser verification (Playwright, desktop 1440px and mobile 390px viewports) against
  `next start`: homepage, the demo race report, and the dynamic OG image all render correctly
  after two rounds of visual fixes (season/race selector layout, pace/degradation chart legibility,
  lap-evolution axis scaling, and an `next/og` "explicit display: flex" Satori requirement in the
  social card).
- All routes return HTTP 200 under `next start`, including the honest "analysis not yet generated"
  state for an unknown race.

## Not verified / blocked

- **No real race analysis has been generated.** This build environment's egress policy denies
  `livetiming.formula1.com` and `api.jolpi.ca` (verified via the agent proxy status endpoint:
  `connect_rejected`, HTTP 403 policy denial -- not a transient failure). `data/generated/` is
  therefore empty; only the synthetic, clearly-labeled demo fixture exists.
  - **Next action**: from an environment with real network access to FastF1's data sources, run
    `pip install -r analysis/requirements.txt` then
    `python scripts/generate_analysis.py 2024 Monaco`, verify the output, and commit the resulting
    file under `data/generated/`. Repeat for whichever races should ship first.
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
- **`bdc-os` registration**: see the "Bryan OS registration" section below for what was and wasn't
  done.
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
- Did not run `bash scripts/check-control-plane.sh` from this session -- see the note in the final
  handoff about whether that was completed.

## Exact next action

1. From a network-unrestricted environment, generate and commit at least one real race analysis
   (`python scripts/generate_analysis.py 2024 Monaco`).
2. Bryan selects and creates the Cloudflare (or alternative) hosting project for `apps/web`,
   including verifying the `opengraph-image` route's `node:fs` behavior on that platform before
   launch.
3. Bryan creates the Brevo "RaceIQ Weekend Brief" list, sender, and attributes, then provides the
   verified list ID and `BREVO_API_KEY` secret to the hosting platform.
4. Only after 1-3: attach the `raceiq.crouchdevelopment.com` domain and flip the frontend from
   preview to production review per `bdc-os/docs/BUILD_AND_PREVIEW_WORKFLOW.md`.
