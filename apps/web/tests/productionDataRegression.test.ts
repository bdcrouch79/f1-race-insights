import { describe, expect, it } from "vitest";

import { listGeneratedAnalyses } from "@/lib/raceData";
import { buildLibraryEntries } from "@/lib/raceLibraryData";
import { findManifestEntry } from "@/lib/raceManifest";

/**
 * Production regression gate for the 2026-08-17 incident: the deployed
 * Worker rendered zero races because runtime node:fs reads against
 * data/generated/** silently returned nothing once request-time code
 * actually ran inside Cloudflare Workers (no persistent filesystem
 * there). See docs/DECISIONS.md for the full root-cause writeup.
 *
 * These tests exercise the REAL production code path (the same
 * lib/raceData.ts, lib/raceLibraryData.ts, and lib/raceManifest.ts the
 * homepage, archive, race reports, sitemap, and OG image routes all
 * import) against the REAL build-generated data artifact -- not a
 * mock, not a fixture written for this test. If scripts/build-data.mjs
 * hasn't run, or a future change reintroduces a runtime dependency
 * that only works in some environments, this fails loudly here, in
 * `npm run test`, rather than shipping silently.
 *
 * This does not replace scripts/verify-worker-runtime.mjs (run via
 * `npm run verify:worker`), which is the check that actually exercises
 * the Cloudflare Workers runtime itself and is what would have caught
 * the incident directly; this test catches the same failure class one
 * layer earlier and faster, at the data-loading level.
 */
describe("production data regression: the built application must contain real races", () => {
  it("listGeneratedAnalyses() returns more than zero real races", () => {
    const races = listGeneratedAnalyses();
    expect(races.length).toBeGreaterThan(0);
  });

  it("every listed race has a real (non-demo) generated analysis", () => {
    const races = listGeneratedAnalyses();
    for (const { analysis } of races) {
      expect(analysis.dataSource).toBe("generated");
    }
  });

  it("buildLibraryEntries() -- what the homepage and archive actually render -- returns more than zero races", () => {
    const entries = buildLibraryEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.length).toBe(listGeneratedAnalyses().length);
  });

  it("at least one race is marked featured, so the homepage spotlight has something to show", () => {
    const entries = buildLibraryEntries();
    expect(entries.some((entry) => entry.featured)).toBe(true);
  });

  it("the manifest join actually attaches editorial metadata to real races, not just resolves to null", () => {
    const races = listGeneratedAnalyses();
    const matched = races.filter(({ year, analysis }) => findManifestEntry(year, analysis.event.name) !== null);
    expect(matched.length).toBeGreaterThan(0);
  });
});
