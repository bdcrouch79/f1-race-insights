import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { EvidenceItem, RaceAnalysis } from "@/lib/schema";

const CARD_DEFS: { key: keyof RaceAnalysis["summary"]; label: string; metric: string }[] = [
  { key: "fastestAveragePaceDriver", label: "Fastest average pace", metric: "averagePace" },
  { key: "mostConsistentDriver", label: "Most consistent", metric: "consistency" },
  { key: "strongestLateRaceDriver", label: "Strongest closing pace", metric: "degradation" },
  { key: "largestPaceDeclineDriver", label: "Largest pace decline", metric: "degradation" },
];

function findEvidence(evidence: EvidenceItem[], metric: string, driver: string | null): EvidenceItem | undefined {
  if (!driver) return undefined;
  return evidence.find((item) => item.metric === metric && item.driver === driver);
}

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
          <div key={card.key} className="riq-panel riq-hover-lift p-5">
            <p className="text-xs uppercase tracking-wide text-riq-gray">{card.label}</p>
            <p className="mt-2 font-display text-2xl tracking-wide text-riq-white">
              {driver ? driverLabel(driver) : card.driverCode}
            </p>
            {card.evidenceItem ? (
              <p className="mt-3 tabular-nums text-sm text-riq-cyan">
                {card.evidenceItem.value > 0 && card.metric === "degradation" ? "+" : ""}
                {card.evidenceItem.value.toFixed(3)} {card.evidenceItem.unit}
                <span className="ml-2 text-riq-gray">· {card.evidenceItem.sampleSize} laps</span>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
