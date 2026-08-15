# RaceIQ Growth

Commercial stage: `unvalidated` (product exists in code; not yet deployed, so no real visitor has
used it)

## Target buyer / visitor

Motorsport fans and people evaluating Crouch Development's engineering work. See `docs/OFFER.md`
for the full picture -- there is no paid product yet, so "growth" here means qualified traffic and
Weekend Brief signups, not revenue.

## Problem and promised outcome

Problem: the finishing order doesn't explain what actually happened in a race. Promised outcome:
RaceIQ shows the pace, consistency, and degradation evidence behind it, for free, in an interactive
report.

## Offer and current price

Free. See `docs/OFFER.md`.

## Acquisition channel (planned)

LinkedIn, primarily Bryan's own posting under Crouch Development, using:

- **Race-weekend content**: a shareable RaceIQ insight card + link to the full report, timed to
  each real Grand Prix once that race's analysis is generated.
- **Historical off-week content**: reports on notable past races (2018+) during weekends without a
  live Grand Prix.

See `docs/CONTENT_ENGINE.md` for the fuller content-format list this may expand into later.

## Funnel events

- `report_view`: a visitor loads `/race/[year]/[event]` for a real (non-demo) analysis.
- `social_card_view`: the `opengraph-image` route is requested (proxy for link unfurl / share
  reach; not yet instrumented).
- `weekend_brief_signup`: a successful `POST /api/subscribe`.

None of these are instrumented with analytics yet -- this is the intended event set, not a
reporting dashboard. See "Current evidence" below.

## Activation definition

A visitor views at least one real race report and scrolls to or interacts with at least one chart.
Not yet measurable (no analytics wired in).

## Conversion definition

A visitor submits the RaceIQ Weekend Brief form successfully. Not yet measurable (Brevo not
connected -- see `docs/CURRENT_STATE.md`).

## Retention definition

A Weekend Brief subscriber opens or clicks a subsequent brief. Not measurable until the brief
itself exists and sends (out of scope for Phase 1 per the brief's own instruction: "Do not send
automated race commentary until the content pipeline exists and has human approval controls.").

## Current evidence

None. RaceIQ is not deployed and has had no real visitors. Do not fabricate a metric here --
record it as unknown until a real number exists.

## Current bottleneck

No real analysis data and no deployment. Distribution cannot start until
`docs/CURRENT_STATE.md`'s "exact next action" items are done.

## Active experiment

None yet -- there is nothing to test until the product is live with real data.

## First validation target

Once deployed with at least one real race analysis: 10 Weekend Brief signups from organic LinkedIn
distribution, as the smallest meaningful signal that the free report is valuable enough for a
stranger to want more.

## Next action

Same as `docs/CURRENT_STATE.md`'s exact next action list: generate real data, deploy, connect
Brevo. Growth work has no meaningful next step before those are done.

## Verification date

2026-08-15 -- initial record, no growth activity yet.
