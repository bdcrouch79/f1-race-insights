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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-riq-black font-sans text-riq-white antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
