#!/usr/bin/env node
/**
 * Build-time data step for RaceIQ's frontend (apps/web).
 *
 * Transforms the repository's committed, authoritative analysis
 * artifacts -- data/generated/raceiq/**, data/race-manifest.json,
 * data/fixtures/demo-race.json -- plus the Crouch Development mark
 * (assets/cd-mark.png) into app-owned JSON files under apps/web/data/.
 * lib/raceData.ts and lib/raceManifest.ts import those files statically
 * (`import x from "../data/....json"`), which Next/webpack inline into
 * the JS bundle at build time.
 *
 * WHY THIS EXISTS: apps/web deploys to Cloudflare Workers via OpenNext.
 * Workers have no persistent filesystem at request time. The previous
 * approach read data/** with node:fs at runtime (paths derived from
 * process.cwd()). That worked under `next start`, and even worked
 * during `next build`'s own prerender step -- both run in a real
 * Node.js process with a real filesystem. It silently returned EMPTY
 * data (no thrown error) whenever the deployed Worker actually executed
 * page code at request time, which happens on any cache miss. This is
 * exactly the 2026-08-17 production incident: the live site rendered
 * zero races. See docs/DECISIONS.md for the full root-cause writeup.
 *
 * Static imports have no runtime filesystem dependency at all, so this
 * failure class cannot recur regardless of OpenNext's caching behavior.
 *
 * This script is NEVER imported by the Next.js app -- it only ever runs
 * as a standalone Node process (locally, or in CI/build environments
 * with a normal filesystem), before Next/webpack run. Its own use of
 * repo-relative paths is fine for exactly that reason; the constraint
 * this fix satisfies is "no filesystem access from code that runs
 * inside the deployed Worker," not "no filesystem access anywhere."
 *
 * Deterministic: output depends only on the committed inputs above.
 * Run automatically via the `generate:data` npm script (wired as a
 * "pre" hook for dev/test/build/cf:build/cf:preview/cf:deploy) and
 * explicitly as its own step in CI before any other frontend step,
 * since CI invokes some tools (e.g. `npx eslint .`) directly rather
 * than through an npm script whose "pre" hook would otherwise fire.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, ".."); // apps/web
const REPO_ROOT = path.resolve(APP_ROOT, "..", ".."); // repo root
const OUT_DIR = path.join(APP_ROOT, "data");

const GENERATED_ROOT = path.join(REPO_ROOT, "data", "generated", "raceiq");
const MANIFEST_PATH = path.join(REPO_ROOT, "data", "race-manifest.json");
const DEMO_FIXTURE_PATH = path.join(REPO_ROOT, "data", "fixtures", "demo-race.json");
const CD_MARK_PATH = path.join(REPO_ROOT, "assets", "cd-mark.png");
const CONTENT_GENERATED_ROOT = path.join(REPO_ROOT, "content", "generated");
const PUBLIC_CONTENT_CARDS_DIR = path.join(APP_ROOT, "public", "content-cards");

/** Compare two "analysisVersion" strings (e.g. "1.10.0" > "1.9.0") -- plain string sort gets this wrong. */
function compareVersions(a, b) {
  const partsA = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Every real generated analysis, deduplicated to the highest
 * analysisVersion per (year, eventSlug) -- the same selection rule the
 * old runtime code applied, just performed once here instead of on
 * every request. Older versioned files stay on disk as an audit trail
 * but are never selected over a newer one.
 */
function buildGeneratedRaces() {
  const best = new Map();
  if (!fs.existsSync(GENERATED_ROOT)) return [];

  for (const versionDir of fs.readdirSync(GENERATED_ROOT)) {
    if (!versionDir.startsWith("v")) continue;
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
          const analysis = readJson(path.join(eventPath, file));

          const key = `${year}/${eventSlug}`;
          const existing = best.get(key);
          if (!existing || compareVersions(analysis.analysisVersion, existing.analysis.analysisVersion) > 0) {
            best.set(key, { year, eventSlug, analysis });
          }
        }
      }
    }
  }

  return [...best.values()].sort((a, b) =>
    a.year === b.year ? a.eventSlug.localeCompare(b.eventSlug) : Number(a.year) - Number(b.year),
  );
}

/**
 * scripts/generate_race_content.py (the RaceIQ Social Content Engine,
 * see docs/DECISIONS.md) writes a committed insight-card PNG per race
 * under content/generated/<year>-<eventSlug>/insight-card-pace.png. This
 * copies the featured card into apps/web/public/content-cards/ (a plain
 * static asset OpenNext ships as-is, no runtime fs) and records which
 * races have one, so the on-site "Download insight graphic" sharing
 * control (components/ShareBar.tsx) can link to it -- and simply not
 * render for a race that doesn't have one yet, since not every one of
 * the 20 races has content generated. Same architecture as everything
 * else in this file: read committed source once at build time, never at
 * request time.
 */
function buildContentCards() {
  const withCard = [];
  if (!fs.existsSync(CONTENT_GENERATED_ROOT)) return withCard;

  for (const dirName of fs.readdirSync(CONTENT_GENERATED_ROOT)) {
    const dirPath = path.join(CONTENT_GENERATED_ROOT, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const manifestPath = path.join(dirPath, "content-manifest.json");
    const cardPath = path.join(dirPath, "insight-card-pace.png");
    if (!fs.existsSync(manifestPath) || !fs.existsSync(cardPath)) continue;

    const manifest = readJson(manifestPath);
    const { year, eventSlug } = manifest.race ?? {};
    if (!year || !eventSlug) continue;

    const destDir = path.join(PUBLIC_CONTENT_CARDS_DIR, String(year), eventSlug);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(cardPath, path.join(destDir, "insight-card-pace.png"));
    withCard.push({ year: String(year), eventSlug });
  }

  return withCard.sort((a, b) => (a.year === b.year ? a.eventSlug.localeCompare(b.eventSlug) : Number(a.year) - Number(b.year)));
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const generatedRaces = buildGeneratedRaces();
  if (generatedRaces.length === 0) {
    console.warn(
      "RaceIQ build-data: WARNING -- found 0 generated races under data/generated/raceiq. " +
        "Is data/generated committed and checked out? The built app will render an empty race library.",
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, "generated-races.json"), JSON.stringify(generatedRaces, null, 2) + "\n");
  console.log(`RaceIQ build-data: wrote ${generatedRaces.length} generated race(s) -> apps/web/data/generated-races.json`);

  const manifest = fs.existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : { races: [] };
  fs.writeFileSync(path.join(OUT_DIR, "race-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`RaceIQ build-data: wrote ${manifest.races?.length ?? 0} manifest entry/entries -> apps/web/data/race-manifest.json`);

  const demoFixture = fs.existsSync(DEMO_FIXTURE_PATH) ? readJson(DEMO_FIXTURE_PATH) : null;
  fs.writeFileSync(path.join(OUT_DIR, "demo-race.json"), JSON.stringify(demoFixture, null, 2) + "\n");
  console.log("RaceIQ build-data: wrote demo fixture -> apps/web/data/demo-race.json");

  const cdMarkDataUri = fs.existsSync(CD_MARK_PATH)
    ? `data:image/png;base64,${fs.readFileSync(CD_MARK_PATH).toString("base64")}`
    : null;
  if (!cdMarkDataUri) {
    console.warn("RaceIQ build-data: WARNING -- assets/cd-mark.png not found; the OG image route's mark will be omitted.");
  }
  fs.writeFileSync(path.join(OUT_DIR, "cd-mark.json"), JSON.stringify({ dataUri: cdMarkDataUri }, null, 2) + "\n");
  console.log("RaceIQ build-data: wrote Crouch Development mark data URI -> apps/web/data/cd-mark.json");

  const contentCards = buildContentCards();
  fs.writeFileSync(path.join(OUT_DIR, "content-cards.json"), JSON.stringify(contentCards, null, 2) + "\n");
  console.log(
    `RaceIQ build-data: copied ${contentCards.length} insight card(s) -> apps/web/public/content-cards/, wrote apps/web/data/content-cards.json`,
  );
}

main();
