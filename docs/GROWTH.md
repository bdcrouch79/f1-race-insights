# RaceIQ Growth

Commercial stage: `unvalidated` (product is live at `https://raceiq.crouchdevelopment.com`,
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

## Acquisition channel (tooling built in Phase 3, distribution not started)

LinkedIn, X, Instagram, and Facebook, primarily Bryan's own posting under Crouch Development,
using:

- **Race-weekend content**: a shareable RaceIQ insight card + link to the full report.
- **Historical off-week content**: reports on notable past races (2018-2024, all 20 curated races
  are now real and live) during weekends without a live Grand Prix.

Phase 3 built the reusable generation tooling for this (`scripts\build-race-content.ps1` ->
`content/generated/<year>-<event>/`, five post drafts + three insight cards per race, deterministic
and traceable to the committed analysis JSON -- see `docs/ARCHITECTURE.md`, "Social Content
Engine") and the first launch package (`content/launch/`), but has not scheduled or published
anything -- Bryan reviews and posts every piece manually. This is deliberately scoped inside this
repository, not `bdcrouch79/bryan-content-engine` (still planned, not built, and governs a
different, LLM-research-backed, voice-driven content model for Bryan's personal/ministry brands --
see `bdc-os/docs/CONTENT_ENGINE.md`). RaceIQ's content is fully deterministic, non-LLM, and scoped
to factual race evidence, which doesn't fit that system's model.

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

## Analytics: what Cloudflare Web Analytics can and cannot measure here (2026-08-18)

Determined during Phase 3, not assumed: Cloudflare's own documentation
(`https://developers.cloudflare.com/web-analytics/faq/`) states plainly that Web Analytics does
not support custom named events ("Not yet, but we may add support for this in the future"). Its
standard beacon (`beacon.min.js`) measures **pageviews and browser performance metrics only** --
which page loaded, how long it took, referrer, country, device type. It cannot natively report a
filter interaction, a button click, or a share-link click as a distinct named event, and this
repository's explicit constraints (no database, no third-party analytics platform, no custom
dashboard) rule out building a substitute for that -- Zaraz or a custom event backend would violate
those constraints.

**What is measurable via Cloudflare Web Analytics once enabled:**

- Homepage views (`/`).
- Race-report views, broken down per real URL (`/race/[year]/[event]`) -- the dashboard's own
  "Top Pages" breakdown gives this per-race, which doubles as a proxy for `report_view` in the
  funnel below.
- Archive views (`/archive`).
- Referrer sources (e.g. how much traffic actually comes from LinkedIn/X posts).

**What is not measurable via Cloudflare Web Analytics, and why nothing was built to fake it:**

- `library_filter_use` (a season/category/driver/featured filter click) -- client-side interaction
  with no page navigation, and no custom-event support.
- `business_cta_click` (the "Turn Your Business Data Into Answers" click-through) -- same reason;
  distinguishable only as an outbound referrer showing up in `crouchdevelopment.com`'s own
  analytics, not as an event on RaceIQ's side.
- `social_card_view` (the OG image route being requested) -- technically a pageview Cloudflare
  could show under "Top Pages" for the `/opengraph-image` path, but link-unfurl bots, not real
  visitors, generate most of these requests, so it's a weak proxy at best.
- Share-button clicks (`components/ShareBar.tsx`'s LinkedIn/X/copy-link/download-graphic buttons).

**How to enable it** (one-time, Bryan's action -- no code required, not done from this session
since it needs Cloudflare dashboard access this session doesn't have):

1. Cloudflare dashboard -> Account Home -> Analytics & Logs -> Web Analytics.
2. Add a site for `raceiq.crouchdevelopment.com`. Since the zone is already proxied through
   Cloudflare (required for the Worker custom domain to exist at all), choose **Automatic Setup**
   -- Cloudflare injects the beacon at the edge, zero code changes, zero redeploys required.
3. View results in the same dashboard location going forward.

**Secondary, code-owned path** (only if automatic setup doesn't apply for some reason, e.g. a
future non-proxied hosting change): `apps/web/app/layout.tsx` already includes a manual beacon
`<script>` tag gated behind `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`. It renders nothing -- inert --
until that environment variable is set on the Worker with the site token from step 2's manual-setup
flow. This requires one Cloudflare Worker environment variable, not a code change, once the token
exists.

None of the funnel events below are instrumented with analytics yet -- this is the intended event
set, not a reporting dashboard. See "Current evidence" below.

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

None. RaceIQ is deployed at its production domain (`https://raceiq.crouchdevelopment.com`) but
distribution hasn't started and Cloudflare Web Analytics isn't confirmed enabled yet, so there is
no real visitor data yet. Do not fabricate a metric here -- record it as unknown until a real
number exists.

## Current bottleneck

No distribution and no analytics enabled yet. The product itself (all 20 real races, the showcase
rebuild, the custom domain, the social content engine) is done; the bottleneck is entirely on the
growth side now, not the product side.

## Active experiment

None yet.

## First validation target

Once distribution starts: a measurable lift in `business_cta_click` from organic LinkedIn posts
referencing specific real races, as the smallest meaningful signal that the showcase actually
moves someone toward Crouch Development's commercial surface.

## Next action

1. Enable Cloudflare Web Analytics (one dashboard click, see above) -- currently pageviews aren't
   measurable either.
2. Begin LinkedIn distribution using the Phase 3 launch package (`content/launch/`) and per-race
   content packages generated via `scripts\build-race-content.ps1` -- see `docs/DECISIONS.md`
   (2026-08-18) and `docs/ARCHITECTURE.md` ("Social Content Engine").
3. Revisit the Weekend Brief and its conversion definition only after Bryan explicitly decides to
   reconnect it (see `docs/ROADMAP.md`).

## Verification date

2026-08-18 -- updated for Phase 3 (RaceIQ Launch and Social Content Engine): production domain
live, content-generation tooling built, analytics researched and documented (not yet enabled).
