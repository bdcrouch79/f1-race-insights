import type { Metadata } from "next";

import { RaceLibrary } from "@/components/RaceLibrary";
import { buildLibraryEntries } from "@/lib/raceLibraryData";
import { LAP_TIMING_MIN_SEASON } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Legendary Race Library",
  description:
    "Every RaceIQ race intelligence report generated so far, filterable by season, category, driver, and featured status.",
};

export default function ArchivePage() {
  const entries = buildLibraryEntries();

  return (
    <div className="riq-container flex flex-col gap-6 py-12">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-riq-white">Legendary Race Library</h1>
        <p className="mt-2 max-w-2xl text-riq-gray">
          Every race below has a real RaceIQ report, generated from FastF1 lap timing data and
          committed as a versioned artifact, not produced live on every visit. RaceIQ&apos;s
          underlying data only reliably covers {LAP_TIMING_MIN_SEASON} onward; see{" "}
          <a href="/methodology" className="underline underline-offset-2 hover:text-riq-white">
            methodology
          </a>{" "}
          for the full coverage matrix.
        </p>
      </div>
      <RaceLibrary entries={entries} />
    </div>
  );
}
