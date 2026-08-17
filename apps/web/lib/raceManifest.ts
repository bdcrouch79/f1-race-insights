import raceManifestData from "../data/race-manifest.json";

/**
 * RaceIQ's curated race library manifest (data/race-manifest.json,
 * see scripts/build-race-library.ps1 and scripts/generate_batch.py).
 * Bundled at build time by scripts/build-data.mjs and imported
 * statically here -- no node:fs at runtime. See lib/raceData.ts and
 * docs/DECISIONS.md (2026-08-17) for why: a previous fs-based
 * implementation worked locally but silently returned empty data once
 * deployed to Cloudflare Workers, which have no persistent filesystem
 * at request time.
 *
 * Provides editorial metadata -- category, featured status, and a
 * short neutral description -- for races that also have a real
 * generated analysis. A race that hasn't been generated yet, or a
 * generated race with no matching manifest entry, simply renders
 * without this metadata; it's additive, never required.
 */

export interface RaceManifestEntry {
  year: number;
  event: string;
  displayName: string;
  category: string;
  featured: boolean;
  description: string;
}

const MANIFEST_ENTRIES: RaceManifestEntry[] = Array.isArray((raceManifestData as { races?: unknown }).races)
  ? ((raceManifestData as { races: RaceManifestEntry[] }).races)
  : [];

/**
 * A manifest `event` query is a country/location name (what FastF1's
 * fuzzy event lookup accepts, e.g. "Germany"), but FastF1's official
 * EventName often uses the demonym/adjective form instead (e.g. "German
 * Grand Prix") -- so the country name is never actually a substring of
 * the real event name. Verified against every one of this repository's
 * 20 committed real analyses (not guessed): these five queries needed
 * an alias to match their real, already-generated EventName.
 */
const EVENT_NAME_ALIASES: Record<string, string[]> = {
  germany: ["german"],
  italy: ["italian"],
  turkey: ["turkish"],
  netherlands: ["dutch"],
  britain: ["british"],
};

/**
 * Look up manifest editorial metadata for a real generated race, by
 * year and the FastF1-resolved event name (e.g. "Monaco Grand Prix").
 *
 * The manifest doesn't store a predicted URL slug -- FastF1 resolves
 * the real one at generation time (see scripts/generate_batch.py), so
 * this matches on the actual resolved event name instead of trusting a
 * guessed slug. A manifest entry's `event` field (the FastF1 lookup
 * query, e.g. "Monaco") is expected to appear inside the real,
 * resolved event name, or to match via EVENT_NAME_ALIASES above when
 * the query is a country name but the real name uses its demonym.
 * Entries that still don't match anything simply never attach metadata
 * to a card, which is a safe, silent no-op.
 */
export function findManifestEntry(year: string, eventName: string): RaceManifestEntry | null {
  const normalizedName = eventName.trim().toLowerCase();
  const candidates = MANIFEST_ENTRIES.filter((entry) => String(entry.year) === year);
  const match = candidates.find((entry) => {
    const query = entry.event.trim().toLowerCase();
    if (normalizedName.includes(query)) return true;
    return (EVENT_NAME_ALIASES[query] ?? []).some((alias) => normalizedName.includes(alias));
  });
  return match ?? null;
}
