import { SummaryCards } from "@/components/SummaryCards";
import type { DriverInfo } from "@/lib/driverInfo";
import { getTakeaways } from "@/lib/raceInsight";
import type { RaceAnalysis } from "@/lib/schema";

/**
 * The race report's lead editorial section. Everything here is
 * generated only from analysis.summary and analysis.evidence -- the
 * same verified metrics the charts below render, never a new
 * computation or an invented conclusion. See docs/METHODOLOGY.md.
 */
export function WhatDecidedTheRace({ analysis, drivers }: { analysis: RaceAnalysis; drivers: DriverInfo }) {
  const takeaways = getTakeaways(analysis, drivers);

  return (
    <section aria-labelledby="riq-decided" className="flex flex-col gap-6">
      <div>
        <h2 id="riq-decided" className="font-display text-3xl tracking-wide text-riq-white sm:text-4xl">
          What Decided The Race
        </h2>
        <p className="mt-2 max-w-2xl text-riq-gray">
          Every figure below is calculated directly from this session&apos;s FastF1 lap timing
          data, not an estimate or a guess.
        </p>
      </div>

      <SummaryCards summary={analysis.summary} evidence={analysis.evidence} drivers={drivers} />

      {takeaways.length > 0 ? (
        <ol className="grid gap-4 sm:grid-cols-3">
          {takeaways.map((takeaway, index) => (
            <li key={takeaway.id} className="riq-panel p-5">
              <p className="font-display text-2xl text-riq-cyan">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm text-riq-white">{takeaway.text}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
