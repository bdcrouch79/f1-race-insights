import type { RaceAnalysis } from "@/lib/schema";

const LABELS: Record<keyof RaceAnalysis["availability"], string> = {
  lapTiming: "Lap timing",
  telemetry: "Telemetry",
  tireCompounds: "Tire compounds",
  weather: "Weather",
};

export function AvailabilityBadges({ availability }: { availability: RaceAnalysis["availability"] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Data availability for this analysis">
      {(Object.keys(LABELS) as (keyof RaceAnalysis["availability"])[]).map((key) => {
        const available = availability[key];
        return (
          <li
            key={key}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              available
                ? "border-riq-cyan/40 text-riq-cyan"
                : "border-riq-gray/25 text-riq-gray"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${available ? "bg-riq-cyan" : "bg-riq-gray/50"}`}
              aria-hidden
            />
            {LABELS[key]}
            <span className="sr-only">{available ? "available" : "not available"}</span>
          </li>
        );
      })}
    </ul>
  );
}
