import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

const SITE_URL = "https://raceiq.crouchdevelopment.com";

const TAGLINE = "The finishing order tells you who won. RaceIQ shows you how the race was won.";
const META_DESCRIPTION =
  "RaceIQ reveals the pace, consistency, and degradation evidence behind how a Formula 1 race was actually won, not just who won it.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RaceIQ — How The Race Was Won",
    template: "%s — RaceIQ",
  },
  description: META_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "RaceIQ",
    title: TAGLINE,
    description: META_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TAGLINE,
    description: META_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Cloudflare Web Analytics's own pageview-only beacon (no code change
// required at all) is the primary path -- see docs/GROWTH.md for the
// one-time dashboard step. This manual snippet is a secondary,
// code-owned activation path that only exists if Bryan sets
// NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN as a Worker environment variable
// after creating a Web Analytics site in the Cloudflare dashboard (the
// token itself is not a secret -- it's a public per-site identifier
// Cloudflare's own docs recommend embedding directly in HTML). Renders
// nothing when unset, which is the default, so this is inert until
// Bryan opts in. See docs/GROWTH.md for exactly what this does and does
// not measure.
const CF_WEB_ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-riq-black font-sans text-riq-white antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        {CF_WEB_ANALYTICS_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: CF_WEB_ANALYTICS_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
