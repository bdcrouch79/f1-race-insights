import type { RaceAnalysis } from "@/lib/schema";

export type DriverInfo = Record<string, RaceAnalysis["drivers"][number]>;

export function buildDriverInfo(drivers: RaceAnalysis["drivers"]): DriverInfo {
  return Object.fromEntries(drivers.map((driver) => [driver.code, driver]));
}
