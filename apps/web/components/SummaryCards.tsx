import { TeamSwatch } from "@/components/TeamSwatch";
import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import { findEvidence } from "@/lib/raceInsight";
import type { EvidenceItem, RaceAnalysis } from "@/lib/schema";

const CARD_DEFS: { key: keyof RaceAnalysis["summary"]; label: string; metric: string }[] = [
  { key: "fastestAveragePaceDriver", label: "Fastest average pace", metric: "averagePace" },
  { key: "mostConsistentDriver", label: "Most consistent", metric: "consistency" },
  { key: "strongestLateRaceDriver", label: "Strongest closing pace", metric: "degradation" },
  { key: "largestPaceDeclineDriver", label: "Largest pace decline", metric: "degradation" },
];

export function SummaryCards({
  summary,
  evidence,
  drivers,
}: {
  summary: RaceAnalysis["summary"];
  evidence: EvidenceItem[];
  drivers: DriverInfo;
}) {
  const cards = CARD_DEFS.map((def) => ({
    ...def,
    driverCode: summary[def.key],
    evidenceItem: findEvidence(evidence, def.metric, summary[def.key]),
  })).filter((card) => card.driverCode);

  if (cards.length === 0) {
    return (
      <p className="riq-panel p-5 text-sm text-riq-gray">
        RaceIQ could not generate an evidence-based summary from the metrics available for this
        session.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const driver = card.driverCode ? drivers[card.driverCode] : undefined;
        return (
          <div key={card.key} className="riq-panel riq-hover-lift p-6">
            <p className="text-xs uppercase tracking-wide text-riq-cyan">{card.label}</p>
            <p className="mt-3 flex items-center gap-2 font-display text-2xl tracking-wide text-riq-white sm:text-3xl">
              <TeamSwatch driver={driver} />
              {driver ? driverLabel(driver) : card.driverCode}
            </p>
            {driver?.team ? <p className="mt-1 text-xs text-riq-gray">{driver.team}</p> : null}
            {card.evidenceItem ? (
              <p className="mt-4 font-display text-xl tabular-nums text-riq-white sm:text-2xl">
                {card.evidenceItem.value > 0 && card.metric === "degradation" ? "+" : ""}
                {card.evidenceItem.value.toFixed(3)}
                <span className="ml-1 text-sm font-sans text-riq-gray">
                  {card.metric === "averagePace" ? "s/lap" : "s"}
                </span>
              </p>
            ) : null}
            {card.evidenceItem ? (
              <p className="mt-1 text-xs text-riq-gray">{card.evidenceItem.sampleSize} quick laps</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
