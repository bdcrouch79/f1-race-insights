import Link from "next/link";

import { PaceChart } from "@/components/charts/PaceChart";
import { TeamSwatch } from "@/components/TeamSwatch";
import { buildDriverInfo } from "@/lib/driverInfo";
import { driverLabel } from "@/lib/format";
import { filterEligibleForHeadline } from "@/lib/headlineEligibility";
import { findEvidence, getPrimaryInsight, type LibraryRaceEntry } from "@/lib/raceInsight";

/** One prominent real race, shown with actual generated metrics -- not a mockup. */
export function FeaturedRaceSpotlight({ entry }: { entry: LibraryRaceEntry }) {
  const { analysis, year, eventSlug } = entry;
  const drivers = buildDriverInfo(analysis.drivers);
  const insight = getPrimaryInsight(analysis, drivers);

  // Same reasoning as opengraph-image.tsx: a decontextualized preview
  // chart (no visible tooltip until hovered) must not show an
  // unrepresentative-sample driver's raw-fastest bar above the actual
  // headline leader -- filter to headline-eligible drivers and
  // recompute gaps relative to the eligible leader, not the single
  // fastest driver overall. See docs/DECISIONS.md (2026-08-16).
  const eligiblePace = filterEligibleForHeadline(analysis.paceRanking, "sampleSize").slice(0, 8);
  const eligibleLeaderSeconds = eligiblePace[0]?.averageLapTimeSeconds ?? 0;
  const spotlightPace = eligiblePace.map((row) => ({
    ...row,
    gapToFastestSeconds: row.averageLapTimeSeconds - eligibleLeaderSeconds,
  }));

  const paceDriver = analysis.summary.fastestAveragePaceDriver;
  const paceEvidence = findEvidence(analysis.evidence, "averagePace", paceDriver);
  const consistencyDriver = analysis.summary.mostConsistentDriver;
  const consistencyEvidence = findEvidence(analysis.evidence, "consistency", consistencyDriver);
  const closingDriver = analysis.summary.strongestLateRaceDriver;
  const closingEvidence = findEvidence(analysis.evidence, "degradation", closingDriver);

  const stats = [
    paceDriver && paceEvidence
      ? { label: "Fastest average pace", code: paceDriver, value: `${paceEvidence.value.toFixed(3)}s` }
      : null,
    consistencyDriver && consistencyEvidence
      ? { label: "Most consistent", code: consistencyDriver, value: `±${consistencyEvidence.value.toFixed(3)}s` }
      : null,
    closingDriver && closingEvidence
      ? {
          label: "Strongest closing pace",
          code: closingDriver,
          value: `${closingEvidence.value < 0 ? "-" : "+"}${Math.abs(closingEvidence.value).toFixed(3)}s`,
        }
      : null,
  ].filter((stat): stat is { label: string; code: string; value: string } => stat !== null);

  return (
    <section className="riq-panel relative overflow-hidden p-6 sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-riq-red/40 px-2.5 py-1 text-[10px] uppercase tracking-wide text-riq-red">
              Featured Race
            </span>
            {entry.category ? (
              <span className="rounded-full border border-riq-cyan/40 px-2.5 py-1 text-[10px] uppercase tracking-wide text-riq-cyan">
                {entry.category.replace(/-/g, " ")}
              </span>
            ) : null}
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-riq-gray">
              {analysis.event.year}
              {analysis.event.circuit ? ` · ${analysis.event.circuit}` : ""}
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-wide text-riq-white sm:text-4xl">
              {analysis.event.name}
            </h2>
          </div>

          <p className="text-lg text-riq-white">{insight}</p>
          {entry.description ? <p className="text-sm text-riq-gray">{entry.description}</p> : null}

          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => {
              const driver = drivers[stat.code];
              return (
                <div key={stat.label} className="rounded-md border riq-divider bg-riq-black/40 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-riq-gray">{stat.label}</p>
                  <p className="mt-1 flex items-center gap-1.5 font-display text-lg text-riq-white">
                    <TeamSwatch driver={driver} />
                    {driver ? driverLabel(driver) : stat.code}
                  </p>
                  <p className="mt-1 font-display text-2xl tabular-nums text-riq-cyan">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <Link
            href={`/race/${year}/${eventSlug}`}
            className="mt-2 inline-block w-fit rounded-md bg-riq-red px-6 py-3 text-sm font-medium text-riq-white transition-opacity hover:opacity-90"
          >
            View Full Report
          </Link>
        </div>

        <div className="w-full max-w-md lg:pt-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-riq-gray">Average Race Pace</p>
          <PaceChart pace={spotlightPace} drivers={drivers} />
        </div>
      </div>
    </section>
  );
}
