import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

const SITE_URL = "https://raceiq.crouchdevelopment.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RaceIQ — Race Intelligence Beneath the Finishing Order",
    template: "%s — RaceIQ",
  },
  description:
    "RaceIQ reveals the pace, consistency, degradation, and performance patterns that shaped a Formula 1 race, beyond the finishing order.",
  openGraph: {
    type: "website",
    siteName: "RaceIQ",
    title: "RaceIQ — Race Intelligence Beneath the Finishing Order",
    description:
      "Select a race. RaceIQ reveals the pace, consistency, degradation, and performance patterns hidden beneath the finishing order.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "RaceIQ — Race Intelligence Beneath the Finishing Order",
    description:
      "Select a race. RaceIQ reveals the pace, consistency, degradation, and performance patterns hidden beneath the finishing order.",
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
