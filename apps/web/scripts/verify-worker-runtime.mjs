#!/usr/bin/env node
/**
 * Production regression gate: boots the ACTUAL Cloudflare Workers
 * runtime (`wrangler dev`, using workerd/Miniflare -- the same engine
 * that runs the deployed Worker) against the built `.open-next` output,
 * then fetches the real routes a visitor would and asserts real race
 * content is present.
 *
 * WHY THIS EXISTS: the 2026-08-17 production incident (zero races
 * rendered on the deployed site) passed every previous check --
 * `next build`, `next start`, and manual browser verification against
 * `next start` -- because none of those exercise the Workers runtime.
 * `next start` runs a real Node.js server with a real filesystem;
 * Cloudflare Workers do not. This script is the check that actually
 * would have caught it: it runs `cf:build`'s output inside workerd and
 * checks the response bytes, not just an HTTP status code (a broken
 * page can still return 200 with an empty body -- see
 * docs/DECISIONS.md, 2026-08-17).
 *
 * Usage:
 *   npm run cf:build && npm run verify:worker
 *
 * Requires the Cloudflare Worker bundle to already be built
 * (`.open-next/`); this script does not build it.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const PORT = process.env.RACEIQ_VERIFY_PORT ?? "8799";
const BASE = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 60_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function textOf(url) {
  const res = await fetch(url);
  return { status: res.status, body: await res.text() };
}

async function main() {
  console.log(`RaceIQ: starting the real Cloudflare Workers runtime (wrangler dev) on port ${PORT}...`);
  const proc = spawn("npx", ["wrangler", "dev", "--local", "--port", PORT], {
    cwd: APP_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderrTail = "";
  proc.stderr?.on("data", (chunk) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-4000);
  });

  const checks = [];
  let exitCode = 0;

  try {
    const up = await waitForServer(`${BASE}/`, READY_TIMEOUT_MS);
    if (!up) {
      throw new Error(`Local Workers runtime did not respond within ${READY_TIMEOUT_MS}ms.\nRecent stderr:\n${stderrTail}`);
    }
    // wrangler reports the socket as open slightly before the Worker is
    // fully ready to serve; give it a brief moment.
    await sleep(1000);

    const home = await textOf(`${BASE}/`);
    const homeCardCount = (home.body.match(/View Report/g) ?? []).length;
    checks.push([
      "homepage renders real race cards",
      home.status === 200 && homeCardCount > 0,
      `status ${home.status}, found ${homeCardCount} "View Report" cards (expected status 200 and > 0)`,
    ]);
    checks.push(["homepage shows the Legendary Race Library", home.body.includes("Legendary Race Library"), "heading not found in response body"]);
    checks.push(["homepage shows a Featured Race", home.body.includes("Featured Race"), "spotlight not found in response body"]);

    const archive = await textOf(`${BASE}/archive`);
    const archiveCardCount = (archive.body.match(/View Report/g) ?? []).length;
    checks.push([
      "archive renders real race cards",
      archive.status === 200 && archiveCardCount > 0,
      `status ${archive.status}, found ${archiveCardCount} cards (expected status 200 and > 0)`,
    ]);

    const sitemapRes = await textOf(`${BASE}/sitemap.xml`);
    const urlCount = (sitemapRes.body.match(/<url>/g) ?? []).length;
    checks.push([
      "sitemap includes real race routes",
      sitemapRes.status === 200 && urlCount > 4,
      `status ${sitemapRes.status}, found ${urlCount} <url> entries (expected > 4 static routes)`,
    ]);

    // Spot-check real race routes pulled from the sitemap itself, rather
    // than hardcoding a slug that could drift from the manifest.
    const raceUrls = [...sitemapRes.body.matchAll(/<loc>[^<]*\/race\/(\d{4})\/([a-z0-9-]+)<\/loc>/g)].map((m) => [m[1], m[2]]);
    checks.push(["found at least one real race route in the sitemap to spot-check", raceUrls.length > 0, "no /race/<year>/<slug> URL found in sitemap.xml"]);

    for (const [year, slug] of raceUrls.slice(0, 3)) {
      const report = await textOf(`${BASE}/race/${year}/${slug}`);
      checks.push([`race report /race/${year}/${slug} responds 200 with real content`, report.status === 200 && report.body.includes("What Decided The Race"), `status ${report.status}`]);

      const ogRes = await fetch(`${BASE}/race/${year}/${slug}/opengraph-image`);
      checks.push([`OG image for /race/${year}/${slug} responds 200`, ogRes.status === 200, `status ${ogRes.status}`]);
    }
  } catch (err) {
    checks.push(["local Workers runtime started and responded", false, String(err instanceof Error ? err.message : err)]);
  } finally {
    proc.kill("SIGKILL");
  }

  console.log("");
  for (const [label, ok, detail] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` -- ${detail}`}`);
    if (!ok) exitCode = 1;
  }
  console.log("");
  console.log(exitCode === 0 ? "verify:worker: all checks passed against the real Workers runtime." : "verify:worker: FAILED -- see above.");

  process.exit(exitCode);
}

main();
