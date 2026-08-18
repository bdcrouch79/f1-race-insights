# RaceIQ Roadmap

## Phase 1 -- scope (done)

See `docs/PRODUCT.md` for the full definition of done. Curated Race Library Engine, all 20 races
real and committed, honest historical-coverage communication -- all inside the existing
repository, with no unsupported claims.

## Phase 2: RaceIQ Showcase Rebuild -- scope (done)

Transformed the frontend from a technical report viewer into a visually-led Crouch Development
showcase: the exact required hero message, a featured-race spotlight using real metrics, the
filterable Legendary Race Library, a race-report "What Decided The Race" lead section with
evidence-backed takeaways, the RaceIQ Weekend Brief hidden from the public experience (code
preserved, not deleted), and language that never implies arbitrary on-demand race generation. See
`docs/DECISIONS.md` (2026-08-17) and `docs/CURRENT_STATE.md` for what was verified.

## Phase 3: RaceIQ Launch and Social Content Engine -- scope (done)

Attached and verified the `raceiq.crouchdevelopment.com` custom domain; built the deterministic,
non-LLM Social Content Engine (`scripts\build-race-content.ps1` -> `content/generated/`) that turns
a committed analysis into five social post drafts, three insight-card PNGs, and a claim-traceable
`content-manifest.json`; added on-site sharing controls (`components/ShareBar.tsx`); added RaceIQ
to Crouch Development's `/systems` page as a proof asset; and produced the first launch campaign
(`content/launch/`, 2021 Abu Dhabi Grand Prix). Researched Cloudflare Web Analytics and documented
what is/isn't measurable rather than building fake event instrumentation. See `docs/DECISIONS.md`
(2026-08-18) and `docs/CURRENT_STATE.md` for what was verified.

## Explicitly excluded from Phase 1, Phase 2, and Phase 3

Authentication, user accounts, payments, subscriptions, fantasy leagues, betting, live timing,
predictions, alternative-outcome simulation, AI chat, mobile apps, team collaboration, a full
telemetry workbench, every possible chart, massive historical pre-generation, rewriting the Python
engine in TypeScript, unverified proprietary scores, unsupported historical claims, a new
repository or application, an LLM-driven content system, a custom analytics database/dashboard, and
a general-purpose social scheduler. Do not build any of these because they seem impressive -- each
needs its own explicit go-ahead.

## After Phase 3 -- candidate next steps, in rough priority order

1. **Enable Cloudflare Web Analytics** (one dashboard click, see `docs/GROWTH.md`) and begin
   LinkedIn/X/Instagram/Facebook distribution using the Phase 3 launch package and per-race content
   packages.
2. **Reconnect the RaceIQ Weekend Brief**, once Bryan explicitly decides to resume it: create the
   Brevo list/sender/attributes, add `BREVO_API_KEY` as a GitHub secret, and re-render
   `WeekendBriefForm` on the homepage and race report (the component and API route are unchanged
   and ready -- see `docs/ARCHITECTURE.md`'s "Frontend composition" section).
3. **Qualifying and sprint session support.** The contract and availability rules are already
   session-aware (`SUPPORTED_SESSIONS`); only the engine's session loading and the frontend
   selector need to expand.
4. **Grow the Legendary Race Library beyond the current 20**, one deliberate manifest edit at a
   time via `scripts\build-race-library.ps1` -- still an editorial decision per race, not a bulk
   operation. Each new race should be reviewed before committing (headline sanity, warnings) per
   the real fixes recorded in `docs/CURRENT_STATE.md` and `docs/DECISIONS.md`.
5. **Generate content packages for the other 19 races** via `scripts\build-race-content.ps1`, on a
   deliberate cadence, each reviewed before posting -- not a bulk/automatic operation.
6. **A hosted Python analysis API or scheduled worker**, if and when that infrastructure is
   authorized, to reduce the manual generation step. This does not replace the versioned JSON
   contract or the commit-as-cache model; it would only change how a file gets generated.
7. **Stint-aware degradation modeling**, if tire-compound and stint-boundary data prove reliable
   enough across enough sessions to responsibly replace the current heuristic label -- and only
   with the heuristic clearly retired in `docs/METHODOLOGY.md`, not silently upgraded in place.

## What requires an explicit decision before starting

Per Bryan OS stop conditions: creating a new repository, renaming this repository, selecting a
paid hosting provider, creating paid infrastructure, creating a database, creating persistent
storage, changing DNS, creating or changing secrets, enabling public email automation, adding
AI-generated analysis, publishing a historical-coverage claim that can't be verified, replacing the
Python engine, adding authentication or payments, and any material trademark or data-licensing
assumption. None of these should be started from this roadmap alone.
