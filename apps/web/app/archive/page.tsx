import type { Metadata } from "next";

import { ArchiveGrid, type ArchiveEntry } from "@/components/ArchiveGrid";
import { DEMO_FIXTURE_ROUTE, listGeneratedAnalyses, loadDemoFixture } from "@/lib/raceData";
import { LAP_TIMING_MIN_SEASON } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every RaceIQ analysis generated so far, filterable by season and Grand Prix.",
};

export default function ArchivePage() {
  const generated = listGeneratedAnalyses();
  const demo = loadDemoFixture();

  const entries: ArchiveEntry[] = [
    ...generated.map(({ year, eventSlug, analysis }) => ({ year, eventSlug, analysis, isSample: false })),
    ...(demo
      ? [{ year: DEMO_FIXTURE_ROUTE.year, eventSlug: DEMO_FIXTURE_ROUTE.eventSlug, analysis: demo, isSample: true }]
      : []),
  ];

  return (
    <div className="riq-container flex flex-col gap-6 py-12">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-riq-white">Archive</h1>
        <p className="mt-2 max-w-2xl text-riq-gray">
          RaceIQ analyses are generated out-of-band from FastF1 and committed as versioned data
          artifacts, not produced live on every visit. This page lists what has actually been
          generated. RaceIQ&apos;s underlying data only reliably covers {LAP_TIMING_MIN_SEASON}
          onward; see{" "}
          <a href="/methodology" className="underline underline-offset-2 hover:text-riq-white">
            methodology
          </a>{" "}
          for the full coverage matrix.
        </p>
      </div>
      <ArchiveGrid entries={entries} />
    </div>
  );
}
