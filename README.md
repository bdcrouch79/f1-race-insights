<p align="center">
  <img src="assets/cd-mark.png" width="90">
</p>

# RaceIQ

**RaceIQ reveals the pace, consistency, degradation, and performance patterns that shaped a
Formula 1 race, beyond the finishing order.**

RaceIQ is a public motorsport intelligence application built by Bryan Crouch under
[Crouch Development](https://crouchdevelopment.com). It grew out of this repository's original
lab, [F1 Race Insights](docs/origin.md) -- a small analytics study built with FastF1, pandas,
matplotlib, and seaborn -- into a production application without discarding that lab's working
analysis.

RaceIQ is independent and not affiliated with Formula 1, the FIA, any team, or any driver.

## What RaceIQ does

1. A visitor explores the Legendary Race Library, a curated set of real, already-generated races,
   filterable by season, category, driver, and featured status.
2. RaceIQ's Python engine loaded the FastF1 race session ahead of time and computed four verified
   metrics: average race pace, lap-time trends, driver consistency, and an opening-versus-closing
   pace degradation heuristic.
3. The engine returns a versioned, structured JSON contract.
4. The Next.js frontend renders that contract as a report led by "What Decided The Race" --
   headline stats and evidence-backed takeaways -- followed by the interactive charts, and offers
   one shareable social insight card per analysis.

RaceIQ is a **historical race analysis engine**, not a simulator: it does not predict or model
alternative race outcomes.

## Repository layout

```text
analysis/raceiq/    Python analysis engine -- callable, tested, versioned contract
analysis/tests/      pytest suite (synthetic fixtures, no live network calls required)
scripts/             generate_analysis.py (real sessions), generate_demo_fixture.py (synthetic)
data/generated/      committed real analysis JSON artifacts
data/fixtures/       synthetic fixtures for tests and the interface-verification demo route
apps/web/            Next.js App Router frontend (TypeScript, Tailwind CSS, Apache ECharts)
docs/                product, architecture, methodology, and operating documentation
```

See [`AGENTS.md`](AGENTS.md) for the full agent operating contract and
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) for exactly what is implemented, verified, and
blocked right now.

## Data source and historical coverage

RaceIQ is built on [FastF1](https://github.com/theOehrly/Fast-F1). FastF1 documents reliable lap
timing, telemetry, and car data from the **2018 season onward**; earlier seasons only have
schedule and classification data, with no lap-by-lap timing. RaceIQ's four analysis views are
therefore only available for 2018 and later. See
[`docs/DATA_AVAILABILITY.md`](docs/DATA_AVAILABILITY.md) for the full, sourced coverage matrix --
do not publish a broader historical claim without re-verifying it there first.

## Run the Python engine locally

```bash
cd analysis
pip install -r requirements.txt
python3 -m pytest -q                                  # engine test suite (no network required)
python3 ../scripts/generate_analysis.py 2024 Monaco    # real session -> data/generated/
```

The original lab script (`python main.py`, using `requirements.txt` at the repository root) still
works unchanged and remains useful for quick local chart exploration; it is not part of the
production RaceIQ path. See [`docs/origin.md`](docs/origin.md) for that lab's background.

Each race you generate downloads and caches session data under `cache/` (gitignored -- never
committed). It's not huge per race, but it accumulates. To clear it on Windows, double-click
`scripts/clean-cache.bat`; it's safe to run any time and only affects local disk, not anything
committed to git.

## Run the frontend locally

```bash
cd apps/web
npm install
npm run dev      # http://localhost:3000
npm run test
npm run build
```

The frontend reads precomputed analysis JSON from `data/generated/` and `data/fixtures/` -- it
does not call FastF1 directly. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why.

## Deploy to Cloudflare

```bash
cd apps/web
npm run cf:build     # build and verify the Cloudflare Worker bundle locally
npm run cf:deploy    # build and deploy (needs `wrangler login` or CLOUDFLARE_API_TOKEN)
```

`.github/workflows/deploy-cloudflare.yml` does this automatically on push to `main`, given
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. See
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) for the exact steps to create and add them.

## Documentation

- [`docs/PRODUCT.md`](docs/PRODUCT.md) -- what RaceIQ is and who it's for
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) -- system design and deployment architecture
- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) -- how every metric is calculated
- [`docs/DATA_AVAILABILITY.md`](docs/DATA_AVAILABILITY.md) -- verified historical coverage matrix
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) -- implementation and deployment state
- [`docs/ROADMAP.md`](docs/ROADMAP.md) -- what's next, explicitly out of scope for Phase 1
- [`docs/DECISIONS.md`](docs/DECISIONS.md) -- durable architecture and stack decisions
- [`docs/OFFER.md`](docs/OFFER.md) -- commercial framing (currently free, audience-building)
- [`docs/GROWTH.md`](docs/GROWTH.md) -- distribution and the RaceIQ Weekend Brief
- [`docs/CONTENT_ENGINE.md`](docs/CONTENT_ENGINE.md) -- future content outputs, all metric-traceable

---

Crouch Development
Systems. Strategy. Execution.
https://crouchdevelopment.com
