import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required by @opennextjs/cloudflare -- without this, its build step
  // can't find .next/standalone and fails outright (verified locally).
  output: "standalone",
  eslint: {
    dirs: ["app", "components", "lib", "tests"],
  },
  // RaceIQ's race data (and the Crouch Development mark used by the OG
  // image route) are bundled at build time by scripts/build-data.mjs
  // into apps/web/data/*.json and imported statically by lib/raceData.ts,
  // lib/raceManifest.ts, and the OG image route. No outputFileTracingIncludes
  // override is needed: static imports are already part of the normal
  // JS bundle, unlike the previous node:fs-at-runtime approach this
  // replaced (see docs/DECISIONS.md, 2026-08-17, for why that approach
  // silently broke once deployed to Cloudflare Workers).
};

export default nextConfig;
