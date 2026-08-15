import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["app", "components", "lib", "tests"],
  },
  // RaceIQ reads precomputed analysis JSON from the repository's /data
  // directory (see lib/raceData.ts). That directory lives outside
  // apps/web, so it must be explicitly traced into the deployed
  // function/worker output or production reads would only work for
  // statically generated routes, not dynamic fallbacks.
  outputFileTracingRoot: path.join(dirname, "..", ".."),
  outputFileTracingIncludes: {
    "/race/[year]/[event]": ["../../data/**"],
    "/archive": ["../../data/**"],
    "/": ["../../data/**"],
  },
};

export default nextConfig;
