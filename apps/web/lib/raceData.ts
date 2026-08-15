import fs from "node:fs";
import path from "node:path";

import { raceAnalysisSchema, type RaceAnalysis } from "@/lib/schema";
import { slugify } from "@/lib/slug";

export { slugify };

/**
 * RaceIQ Phase 1 reads precomputed analysis JSON artifacts from the
 * repository's /data directory rather than calling the Python engine
 * on demand. See docs/ARCHITECTURE.md for why: FastF1/pandas cannot
 * run in a standard Cloudflare Worker, and no hosted Python analysis
 * service is verified/authorized yet.
 *
 * These reads happen server-side, at build time or on a server
 * component request, against the full monorepo checkout -- never in
 * the browser.
 */

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const GENERATED_ROOT = path.join(REPO_ROOT, "data", "generated", "raceiq");
const FIXTURES_ROOT = path.join(REPO_ROOT, "data", "fixtures");

export interface RaceParams {
  year: string;
  event: string;
}

function readAndValidate(filePath: string): RaceAnalysis | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = raceAnalysisSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error(`RaceIQ: invalid analysis payload at ${filePath}`, parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

/** Load a generated (real) race analysis, keyed by the RaceIQ cache convention. */
export function loadGeneratedAnalysis(year: string, eventSlug: string, session = "R"): RaceAnalysis | null {
  if (!fs.existsSync(GENERATED_ROOT)) return null;
  const versionDirs = fs.readdirSync(GENERATED_ROOT).filter((d) => d.startsWith("v"));
  for (const versionDir of versionDirs) {
    const candidate = path.join(GENERATED_ROOT, versionDir, year, eventSlug, `${session}.json`);
    const result = readAndValidate(candidate);
    if (result) return result;
  }
  return null;
}

/** List every generated (real) analysis currently committed to the repository. */
export function listGeneratedAnalyses(): { year: string; eventSlug: string; analysis: RaceAnalysis }[] {
  if (!fs.existsSync(GENERATED_ROOT)) return [];
  const results: { year: string; eventSlug: string; analysis: RaceAnalysis }[] = [];

  for (const versionDir of fs.readdirSync(GENERATED_ROOT)) {
    const versionPath = path.join(GENERATED_ROOT, versionDir);
    if (!fs.statSync(versionPath).isDirectory()) continue;

    for (const year of fs.readdirSync(versionPath)) {
      const yearPath = path.join(versionPath, year);
      if (!fs.statSync(yearPath).isDirectory()) continue;

      for (const eventSlug of fs.readdirSync(yearPath)) {
        const eventPath = path.join(yearPath, eventSlug);
        if (!fs.statSync(eventPath).isDirectory()) continue;

        for (const file of fs.readdirSync(eventPath)) {
          if (!file.endsWith(".json")) continue;
          const analysis = readAndValidate(path.join(eventPath, file));
          if (analysis) results.push({ year, eventSlug, analysis });
        }
      }
    }
  }
  return results;
}

/** Load the synthetic demo fixture used for interface verification only. */
export function loadDemoFixture(): RaceAnalysis | null {
  return readAndValidate(path.join(FIXTURES_ROOT, "demo-race.json"));
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
