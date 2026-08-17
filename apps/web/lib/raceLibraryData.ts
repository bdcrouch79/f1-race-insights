import { listGeneratedAnalyses } from "@/lib/raceData";
import { findManifestEntry } from "@/lib/raceManifest";
import type { LibraryRaceEntry } from "@/lib/raceInsight";

/**
 * Server-only: builds the Legendary Race Library's entry list from
 * every real generated analysis, joined to its manifest editorial
 * metadata (category, featured status, description) when a match
 * exists. Deliberately excludes the synthetic demo/sample fixture --
 * the library only ever shows real races with real generated metrics.
 * Both app/page.tsx and app/archive/page.tsx call this so there is one
 * source of truth for what the library contains.
 */
export function buildLibraryEntries(): LibraryRaceEntry[] {
  return listGeneratedAnalyses().map(({ year, eventSlug, analysis }) => {
    const manifestEntry = findManifestEntry(year, analysis.event.name);
    return {
      year,
      eventSlug,
      analysis,
      category: manifestEntry?.category,
      featured: manifestEntry?.featured ?? false,
      description: manifestEntry?.description,
    };
  });
}
