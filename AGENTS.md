# RaceIQ Agent Operating Contract

This repository (`bdcrouch79/f1-race-insights`) is the authoritative source for **RaceIQ**, a
public motorsport intelligence application built by Bryan Crouch under Crouch Development. It
governs itself according to the Bryan OS App Factory (`bdcrouch79/bdc-os`).

## Required startup sequence

Before planning or implementing work in this repository:

1. Read `README.md` and this file.
2. Read `docs/CURRENT_STATE.md` for what is actually implemented, verified, and blocked right now.
3. Read `docs/ARCHITECTURE.md` and `docs/DATA_AVAILABILITY.md` before making any claim about what
   RaceIQ can analyze.
4. Check `bdcrouch79/bdc-os` `registry/apps.yaml` for the `raceiq` entry and cross-portfolio
   context before changing infrastructure, domain, or commercial state.

## Source-of-truth order

1. This repository (code, tests, generated data, docs)
2. Bryan OS (`bdcrouch79/bdc-os`) registry and operating documents
3. Verified live infrastructure state
4. Chat context
5. Memory or assumptions

## Non-negotiable rules specific to RaceIQ

- **Never publish an unverified historical-coverage claim.** RaceIQ's four analysis views require
  FastF1 lap timing data, documented as available from the 2018 season onward. Do not claim
  broader coverage without re-verifying against FastF1's current documentation and updating
  `docs/DATA_AVAILABILITY.md` in the same change.
- **Never present fixture or demo data as a real, live, or on-demand analysis.** Any payload with
  `dataSource: "demo-fixture"` must render a visible sample-data notice and must not be indexed.
- **The analysis engine (`analysis/raceiq/`) stays Python.** Do not port FastF1/pandas logic to
  TypeScript. The frontend consumes the versioned JSON contract in
  `analysis/raceiq/schemas.py` / `apps/web/lib/schema.ts`; keep both in sync when the contract
  changes, and bump `ANALYSIS_VERSION` when the meaning of existing output would change.
- **Do not call the engine a simulator.** It analyzes recorded sessions; it does not model or
  predict alternative outcomes.
- **No AI-generated race narrative in Phase 1.** `analysis/raceiq/narrative.py` is a deterministic
  template, not an LLM call. Do not add one without an explicit, separately authorized decision
  recorded in `docs/DECISIONS.md`.
- **Do not commit secrets.** `BREVO_API_KEY` and any future provider credentials live only in the
  hosting platform's secret store.
- **Do not attach the production domain, create paid infrastructure, or enable live email
  automation without Bryan's explicit go-ahead.** See `docs/CURRENT_STATE.md` for the current
  deployment blocker and the exact next action.

## Required project documents

- `AGENTS.md` (this file)
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/CURRENT_STATE.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`
- `docs/DATABASE_TARGET.md`
- `docs/OFFER.md`
- `docs/GROWTH.md`
- `docs/METHODOLOGY.md`
- `docs/DATA_AVAILABILITY.md`
- `docs/CONTENT_ENGINE.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Repository layout

```text
analysis/raceiq/    Python analysis engine (callable, tested, versioned contract)
analysis/tests/      pytest suite (synthetic fixtures, no live network calls)
scripts/             generate_analysis.py (real, out-of-band), generate_demo_fixture.py (synthetic)
data/generated/      committed real analysis JSON artifacts (RaceIQ's cache)
data/fixtures/       synthetic fixtures used by tests and the demo route
apps/web/            Next.js App Router frontend (TypeScript, Tailwind, ECharts)
docs/                required project documentation
```

## Verification before declaring work complete

- `cd analysis && python3 -m pytest -q`
- `cd apps/web && npm run typecheck && npm run lint && npm run test && npm run build`
- Update `docs/CURRENT_STATE.md` with what changed, what was verified, and the exact next action.
