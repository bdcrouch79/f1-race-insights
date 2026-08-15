# RaceIQ Database Target

## Current target: none

RaceIQ Phase 1 has no database. Race analyses are file-based artifacts
(`data/generated/**/*.json`), committed to this repository and read directly from disk by the
Next.js frontend. See `docs/ARCHITECTURE.md` for the full data-flow and caching model.

- `supabase_project_id`: `null`
- `supabase_schema`: `null`

## Why not Supabase in Phase 1

Nothing in Phase 1 needs mutable, queryable, multi-writer state:

- Analyses are generated out-of-band and are effectively immutable once committed.
- The RaceIQ Weekend Brief signup writes directly to Brevo (a CRM/email platform), not to a RaceIQ
  database.
- There is no user account, session, or any other state that needs to persist per visitor.

## When this would change

A database becomes relevant only if a future phase adds state that genuinely needs one -- for
example, tracking Weekend Brief engagement inside RaceIQ itself rather than in Brevo, or storing
generation job status if analysis generation moves to an automated pipeline (see
`docs/ROADMAP.md`). Any such addition must:

1. Declare which of Bryan's two shared Supabase projects it targets (per `bdc-os/docs/
   INFRASTRUCTURE.md`) and which schema, explicitly -- never inferred.
2. Be recorded here and in `bdc-os/registry/apps.yaml` in the same body of work.
3. Ship with committed migrations under `supabase/migrations/`, per the Bryan OS repository
   standard.

No such addition exists yet. This document should be treated as accurate until a decision entry in
`docs/DECISIONS.md` says otherwise.
