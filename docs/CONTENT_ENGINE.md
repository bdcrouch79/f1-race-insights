# RaceIQ Content Engine

This defines the future content outputs RaceIQ's data can support. **None of these are built in
Phase 1.** They are recorded here so a future content pass has a clear, bounded target instead of
inventing formats ad hoc -- and so every future output stays traceable to a real metric, per
`docs/METHODOLOGY.md`.

## Non-negotiable rule

Every generated claim in any future content format must trace back to a specific metric, driver,
value, and sample size from a real, generated RaceIQ analysis (`data/generated/**/*.json`) --
never from the demo fixture, never from an LLM's general knowledge of a race, and never phrased
more confidently than the underlying metric supports (see the degradation-heuristic honesty rule
in `docs/METHODOLOGY.md`).

## Planned future formats (not built)

- **LinkedIn post**: one headline finding (from `summary`) + the social card image + link to the
  full report. Natural first format given `docs/GROWTH.md`'s planned channel.
- **X/Twitter thread**: 3-5 posts, one per chart, each citing its metric and sample size.
- **Instagram caption**: pairs with the social card image; short, evidence-anchored, no filler
  hype language (see the repository-wide copy rules below).
- **Short-video hooks**: a single spoken line per finding, written to be read over the relevant
  chart (e.g., pace or degradation), still sourced from `evidence`.
- **One-minute script**: narrates the four views in order (pace -> lap evolution -> consistency ->
  degradation) using the same language as `/methodology`.
- **Long-form outline**: a structured breakdown for a written race recap, one section per metric,
  with an explicit "what this doesn't tell us" section drawn from `docs/METHODOLOGY.md`'s
  exclusions list.
- **Newsletter brief**: the actual content of the RaceIQ Weekend Brief once Brevo is connected --
  see `docs/GROWTH.md`.
- **Social graphics beyond the single OG card**: e.g. a per-driver card, a consistency-only card.
  Deferred; Phase 1 ships exactly one card format per the brief's explicit scope limit.

## Copy rules (apply to all current and future RaceIQ content)

Plain, direct voice. Avoid em dashes, "not this, but that" constructions, "you're not X, you're
Y," fake drama, one-sentence hype stacks, four-word paragraph spam, generic AI phrasing,
"revolutionary," "game-changing," "cutting-edge," "unlock," filler "leverage," unsupported
superlatives, manufactured urgency, and fabricated authority. Prefer clear explanations, specific
metrics, evidence, confident restraint, and useful interpretation.

## What stays out of scope regardless of format

No AI-generated race commentary ships automatically. Per `docs/ROADMAP.md` and this repository's
`AGENTS.md`: no LLM writes RaceIQ's summary or any derived content without an explicit, separately
recorded decision and a human approval step before anything publishes.
