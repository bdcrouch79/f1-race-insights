import type { MetadataRoute } from "next";

import { listGeneratedAnalyses } from "@/lib/raceData";

const SITE_URL = "https://raceiq.crouchdevelopment.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/archive`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Only real, generated analyses are indexed. The demo fixture route is
  // marked noindex in its own generateMetadata and intentionally
  // excluded here.
  const raceRoutes: MetadataRoute.Sitemap = listGeneratedAnalyses().map(({ year, eventSlug }) => ({
    url: `${SITE_URL}/race/${year}/${eventSlug}`,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...raceRoutes];
}
