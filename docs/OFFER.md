# RaceIQ Offer

Commercial stage: `not_applicable` (no paid product exists or is planned for Phase 1)

RaceIQ is a **free public audience-building and proof asset** for Crouch Development. This
document exists to satisfy the Bryan OS Offer Factory contract honestly, not to manufacture a
commercial offer that doesn't exist yet.

## Public dream outcome

A visitor understands what actually happened in a Formula 1 race -- who really had the pace, who
was consistent, who faded -- in under a minute, with evidence they can trust, for free, with no
signup required to see it.

## Target visitor

- Motorsport fans who follow race weekends and want a deeper read than the finishing order.
- People evaluating Crouch Development's engineering capability (recruiters, prospective clients,
  peers) -- RaceIQ is a public demonstration of product and software quality, not just a data
  toy.

## RaceIQ Weekend Brief -- built, currently hidden

- **What it is**: a free email brief planned to send after each race, described in its own UI copy
  as "the data story the finishing order missed."
- **Price**: free.
- **Status**: the signup form (`WeekendBriefForm`) and API route (`/api/subscribe`) are
  code-complete but not rendered anywhere in the public experience as of the Phase 2 showcase
  rebuild (2026-08-17) -- see `docs/DECISIONS.md`. The Brevo list, sender, and secret are also
  still not created, so the route would fail safely even if it were shown. Re-enabling it is an
  explicit future decision, not automatic once Brevo is connected. See `docs/CURRENT_STATE.md`.

## Conversion objective (current)

Not revenue. With the Weekend Brief hidden, the objective is a visitor reaching Crouch
Development's commercial surface (the homepage's "Turn Your Business Data Into Answers" CTA) as a
measurable proxy for "does this showcase feel credible enough to explore Crouch Development's
actual work." See `docs/GROWTH.md` for how this is measured.

## No current paid product

There is no price, payment structure, guarantee, bonus stack, or scarcity/urgency mechanism for
RaceIQ, and none should be added without a separate, explicit Offer Factory pass through
`bdc-os/docs/OFFER_FACTORY.md` -- Phase 1 must not manufacture one to look commercially complete.

## Validation questions for a future paid layer (unanswered, explicitly not assumed)

- Would any RaceIQ visitor pay for deeper access (more seasons, more sessions, driver comparison
  tools, exportable data)? Unknown -- no evidence collected yet.
- Would a broadcaster, team, or media outlet license RaceIQ's engine or output? Unknown.
- Is the Weekend Brief itself a plausible upsell surface later, or does monetizing it damage trust
  in an otherwise free tool? Unknown.

## Future monetization hypotheses (explicitly labeled as hypotheses, not decisions)

- **Hypothesis**: a paid "RaceIQ Pro" tier could unlock deeper telemetry views or cross-race
  comparisons for serious fans. Untested.
- **Hypothesis**: RaceIQ's engine or dataset could be licensed to media/content creators. Untested.
- **Hypothesis**: RaceIQ could become a lead-generation surface for Crouch Development's paid
  systems/consulting work, separate from any RaceIQ-native paid product. Untested, but consistent
  with RaceIQ's current role as a public proof asset.

None of these should move forward without a real Offer Factory pass, real buyer evidence, and
Bryan's explicit decision.
