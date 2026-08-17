# RaceIQ Roadmap

## Phase 1 (this build) -- scope

See `docs/PRODUCT.md` for the full definition of done. In short: RaceIQ branding, the refactored
Python engine with a versioned contract, the Next.js frontend with all four verified analysis
views, one shareable social card, Weekend Brief capture, and honest historical-coverage
communication -- all inside the existing repository, with no unsupported claims.

## Explicitly excluded from Phase 1

Authentication, user accounts, payments, subscriptions, fantasy leagues, betting, live timing,
predictions, alternative-outcome simulation, AI chat, mobile apps, team collaboration, a full
telemetry workbench, every possible chart, every social format, massive historical
pre-generation, rewriting the Python engine in TypeScript, unverified proprietary scores, and
unsupported historical claims. Do not build any of these because they seem impressive -- each
needs its own explicit go-ahead.

## After Phase 1 -- candidate next steps, in rough priority order

1. ~~Build a repeatable local Race Library Engine.~~ Done -- `data/race-manifest.json` (20 curated
   races, 2018-2024) plus `scripts\build-race-library.ps1`. **Generate and commit the real analyses
   it produces** is still the next action: nothing after this matters until real data exists for
   more than one race. See `docs/CURRENT_STATE.md` for the exact command.
2. **Deploy the frontend and verify production behavior**, including the `opengraph-image` route's
   filesystem access on whichever platform is chosen (see the Cloudflare risk in
   `docs/ARCHITECTURE.md`).
3. **Connect the RaceIQ Weekend Brief to Brevo** once the list, sender, and secret exist.
4. **Qualifying and sprint session support.** The contract and availability rules are already
   session-aware (`SUPPORTED_SESSIONS`); only the engine's session loading and the frontend
   selector need to expand.
5. ~~A small, deliberately scoped set of additional historical races.~~ Superseded by the Race
   Library Engine (step 1): the curation decision now lives once, reviewably, in
   `data/race-manifest.json` (20 races, still deliberately scoped -- not every season since 2018)
   rather than being repeated as one-off script runs. Each race the manifest generates should still
   be reviewed before committing (headline sanity, warnings) per the three real fixes recorded in
   `docs/CURRENT_STATE.md`; growing the manifest further, or removing/replacing an entry, is still a
   deliberate editorial decision, not a bulk operation to automate away.
6. **A hosted Python analysis API or scheduled worker**, if and when that infrastructure is
   authorized, to reduce the manual generation step. This does not replace the versioned JSON
   contract or the commit-as-cache model; it would only change how a file gets generated.
7. **Stint-aware degradation modeling**, if tire-compound and stint-boundary data prove reliable
   enough across enough sessions to responsibly replace the current heuristic label -- and only
   with the heuristic clearly retired in `docs/METHODOLOGY.md`, not silently upgraded in place.

## What requires an explicit decision before starting

Per Bryan OS stop conditions: creating a new repository, renaming this repository, selecting a
paid hosting provider, creating paid infrastructure, creating a database, creating persistent
storage, changing DNS, attaching the production domain, creating or changing secrets, enabling
public email automation, adding AI-generated analysis, publishing a historical-coverage claim that
can't be verified, replacing the Python engine, adding authentication or payments, and any material
trademark or data-licensing assumption. None of these should be started from this roadmap alone.
