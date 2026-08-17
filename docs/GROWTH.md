# RaceIQ Growth

Commercial stage: `unvalidated` (product is live at `https://raceiq-web.bryan-7df.workers.dev`,
but no distribution has started yet and no real visitor traffic has been observed)

## Target buyer / visitor

Motorsport fans and people evaluating Crouch Development's engineering work. See `docs/OFFER.md`
for the full picture -- there is no paid product, so "growth" here means qualified traffic as a
proxy for a credible showcase, not revenue.

## Problem and promised outcome

Problem: the finishing order doesn't explain what actually happened in a race. Promised outcome:
RaceIQ shows the pace, consistency, and degradation evidence behind it, for free, evidence you can
trace back to the lap.

## Offer and current price

Free. See `docs/OFFER.md`.

## Acquisition channel (planned, not started)

LinkedIn, primarily Bryan's own posting under Crouch Development, using:

- **Race-weekend content**: a shareable RaceIQ insight card + link to the full report.
- **Historical off-week content**: reports on notable past races (2018-2024, all 20 curated races
  are now real and live) during weekends without a live Grand Prix.

See `docs/CONTENT_ENGINE.md` for the fuller content-format list this may expand into later --
explicitly not started; Phase 2 is the showcase itself, not distribution of it.

## Funnel events

- `report_view`: a visitor loads `/race/[year]/[event]` for a real analysis.
- `library_filter_use`: a visitor uses a Legendary Race Library filter (season, category, driver,
  featured) -- a proxy for genuine exploration versus a single bounce.
- `social_card_view`: the `opengraph-image` route is requested (proxy for link unfurl / share
  reach; not yet instrumented).
- `business_cta_click`: a visitor clicks "Turn Your Business Data Into Answers" through to
  crouchdevelopment.com/systems -- the actual commercial objective of this showcase.

`weekend_brief_signup` is removed from the current funnel: Phase 2 deliberately hides the Weekend
Brief form from the public experience (see `docs/DECISIONS.md`, 2026-08-17), so it cannot be a
conversion event right now regardless of Brevo connectivity. It returns to this list if and when
Bryan explicitly decides to reconnect it.

None of the events above are instrumented with analytics yet -- this is the intended event set,
not a reporting dashboard. See "Current evidence" below.

## Activation definition

A visitor views at least one real race report and interacts with the Legendary Race Library
(a filter, a search, or opening a second report). Not yet measurable (no analytics wired in).

## Conversion definition

Currently `business_cta_click` (visitor reaches crouchdevelopment.com/systems from RaceIQ) --
the showcase's actual purpose per this phase's brief. Not yet measurable (no analytics wired in).
The Weekend Brief signup is not a current conversion definition; see "Funnel events" above.

## Retention definition

Not defined for this phase -- RaceIQ has no returning-visitor mechanism (no accounts, no email)
while the Weekend Brief is hidden. Revisit once distribution or the Weekend Brief resumes.

## Current evidence

None. RaceIQ is deployed (`https://raceiq-web.bryan-7df.workers.dev`) but distribution hasn't
started and no analytics are wired in, so there is no real visitor data yet. Do not fabricate a
metric here -- record it as unknown until a real number exists.

## Current bottleneck

No distribution and no analytics. The product itself (all 20 real races, the showcase rebuild) is
done and live; the bottleneck is entirely on the growth side now, not the product side.

## Active experiment

None yet.

## First validation target

Once distribution starts: a measurable lift in `business_cta_click` from organic LinkedIn posts
referencing specific real races, as the smallest meaningful signal that the showcase actually
moves someone toward Crouch Development's commercial surface.

## Next action

1. Wire basic, privacy-respecting analytics (page views, the funnel events above) -- currently
   nothing is measurable.
2. Begin LinkedIn distribution per the planned acquisition channel above.
3. Revisit the Weekend Brief and its conversion definition only after Bryan explicitly decides to
   reconnect it (see `docs/ROADMAP.md`).

## Verification date

2026-08-17 -- updated for Phase 2 (RaceIQ Showcase Rebuild): product is live, funnel redefined
around the showcase/business-CTA objective now that the Weekend Brief is hidden.
