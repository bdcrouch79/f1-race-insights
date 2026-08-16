import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";

/**
 * A small color dot identifying a driver's team, using FastF1's real
 * per-season team color -- never a team logo. See docs/DECISIONS.md
 * for why RaceIQ doesn't use official team/F1 logos.
 */
export function TeamSwatch({ driver }: { driver: DriverInfo[string] | undefined }) {
  if (!driver?.teamColor) return null;
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
      style={{ backgroundColor: driver.teamColor }}
      aria-hidden
    />
  );
}

/** Driver name/code with a leading team-color swatch, for inline text rows. */
export function DriverWithTeam({ driver, code }: { driver: DriverInfo[string] | undefined; code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamSwatch driver={driver} />
      {driver ? driverLabel(driver) : code}
      {driver?.team ? <span className="text-riq-gray">· {driver.team}</span> : null}
    </span>
  );
}
