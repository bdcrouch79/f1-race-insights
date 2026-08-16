import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required by @opennextjs/cloudflare -- without this, its build step
  // can't find .next/standalone and fails outright (verified locally).
  output: "standalone",
  eslint: {
    dirs: ["app", "components", "lib", "tests"],
  },
  // RaceIQ reads precomputed analysis JSON from the repository's /data
  // directory (see lib/raceData.ts), one level above apps/web. Deliberately
  // NOT overriding outputFileTracingRoot to point up at the monorepo root:
  // apps/web has its own package-lock.json, so Next (and @opennextjs/cloudflare,
  // which auto-detects a "monorepo root" the same way) already treats apps/web
  // as its own root. Overriding it broke @opennextjs/cloudflare's build --
  // it nests standalone output under apps/web/.next/... but looks for
  // .next/standalone/.next/server/pages-manifest.json unnested, so the build
  // fails outright (verified locally). outputFileTracingIncludes below still
  // reaches outside the app directory to the real /data fine without the
  // override; verified the resulting bundle (.open-next/data/...) actually
  // contains the generated race JSON.
  outputFileTracingIncludes: {
    "/race/[year]/[event]": ["../../data/**"],
    "/archive": ["../../data/**"],
    "/": ["../../data/**"],
  },
};

export default nextConfig;
