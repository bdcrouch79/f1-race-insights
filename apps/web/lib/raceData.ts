import { raceAnalysisSchema, type RaceAnalysis } from "@/lib/schema";
import { slugify } from "@/lib/slug";

import generatedRacesData from "../data/generated-races.json";
import demoFixtureData from "../data/demo-race.json";

export { slugify };

/**
 * RaceIQ reads precomputed analysis JSON artifacts from data/generated/
 * and data/fixtures/, but never via node:fs at runtime -- Cloudflare
 * Workers have no persistent filesystem at request time, and a
 * previous process.cwd()-relative fs implementation shipped a
 * production incident where the deployed site silently rendered zero
 * races (see docs/DECISIONS.md, 2026-08-17). scripts/build-data.mjs
 * transforms data/generated/** and data/fixtures/demo-race.json into
 * apps/web/data/*.json at build time; the imports above get inlined
 * into the JS bundle by webpack, so there is no runtime filesystem
 * dependency at all, in any environment (Node, Workers, or otherwise).
 */

export interface RaceParams {
  year: string;
  event: string;
}

interface GeneratedRaceRecord {
  year: string;
  eventSlug: string;
  analysis: unknown;
}

function validate(raw: unknown, label: string): RaceAnalysis | null {
  const parsed = raceAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`RaceIQ: invalid analysis payload at ${label}`, parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

/**
 * All real generated analyses, already deduplicated to the highest
 * analysisVersion per race by scripts/build-data.mjs. This module only
 * validates the contract at import time (so a malformed bundled file
 * fails loudly instead of rendering silently wrong) -- it does not
 * re-derive which version "wins" for a race; that selection already
 * happened at build time.
 */
const GENERATED_RACES: { year: string; eventSlug: string; analysis: RaceAnalysis }[] = (
  generatedRacesData as GeneratedRaceRecord[]
)
  .map(({ year, eventSlug, analysis }) => {
    const validated = validate(analysis, `data/generated-races.json (${year}/${eventSlug})`);
    return validated ? { year, eventSlug, analysis: validated } : null;
  })
  .filter((entry): entry is { year: string; eventSlug: string; analysis: RaceAnalysis } => entry !== null);

const DEMO_FIXTURE: RaceAnalysis | null = demoFixtureData ? validate(demoFixtureData, "data/demo-race.json") : null;

/**
 * Load a generated (real) race analysis, keyed by the RaceIQ cache
 * convention (year, event slug, session).
 */
export function loadGeneratedAnalysis(year: string, eventSlug: string, session = "R"): RaceAnalysis | null {
  const match = GENERATED_RACES.find(
    (entry) => entry.year === year && entry.eventSlug === eventSlug && entry.analysis.event.session === session,
  );
  return match?.analysis ?? null;
}

/** List every generated (real) analysis currently committed to the repository, one entry per race. */
export function listGeneratedAnalyses(): { year: string; eventSlug: string; analysis: RaceAnalysis }[] {
  return GENERATED_RACES;
}

/** Load the synthetic demo fixture used for interface verification only. */
export function loadDemoFixture(): RaceAnalysis | null {
  return DEMO_FIXTURE;
}

export const DEMO_FIXTURE_ROUTE = { year: "2026", eventSlug: "raceiq-demo-grand-prix" } as const;

/**
 * Resolve a /race/[year]/[event] request to an analysis. Real generated
 * analyses always take priority; the demo fixture only ever answers its
 * own dedicated, clearly-labeled route.
 */
export function resolveAnalysis(year: string, eventSlug: string, session = "R"): RaceAnalysis | null {
  const generated = loadGeneratedAnalysis(year, eventSlug, session);
  if (generated) return generated;

  if (year === DEMO_FIXTURE_ROUTE.year && eventSlug === DEMO_FIXTURE_ROUTE.eventSlug) {
    return loadDemoFixture();
  }
  return null;
}
