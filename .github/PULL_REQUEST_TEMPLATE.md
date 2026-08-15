## Summary

<!-- What changed and why, in 1-3 bullets. -->

-

## Scope

- [ ] Python analysis engine (`analysis/raceiq/`)
- [ ] Frontend (`apps/web`)
- [ ] Generated data (`data/generated/`, `data/fixtures/`)
- [ ] Documentation only

## Verification

- [ ] `cd analysis && python3 -m pytest -q`
- [ ] `cd apps/web && npm run typecheck`
- [ ] `cd apps/web && npm run lint`
- [ ] `cd apps/web && npm run test`
- [ ] `cd apps/web && npm run build`
- [ ] Reviewed the full diff for committed secrets, generated caches, or unintended large files
- [ ] Manually verified in a browser (for frontend/UI changes)

## Historical-coverage / methodology impact

- [ ] This change does not alter what RaceIQ claims about historical data coverage
- [ ] This change *does* alter a coverage or methodology claim -- `docs/DATA_AVAILABILITY.md` and/or
      `docs/METHODOLOGY.md` were updated in this PR to match, with sourcing

## Documentation

- [ ] `docs/CURRENT_STATE.md` updated if implementation or deployment state materially changed
- [ ] `docs/DECISIONS.md` updated if this introduces a durable architecture/stack decision
- [ ] No new secrets committed; any new required secret name is documented, not its value
