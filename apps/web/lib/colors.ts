/**
 * Chart series palette. The three RaceIQ brand accents (cyan, orange,
 * red) anchor the set; two supporting hues extend it to cover up to
 * five ranked drivers without reusing a color within one chart.
 */
export const CHART_SERIES_COLORS = [
  "#30D5FF", // electric cyan
  "#FF6B00", // signal orange
  "#FF2B2B", // racing red
  "#A78BFA", // supporting violet
  "#34D399", // supporting green
] as const;

export function colorForIndex(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length] ?? "#8C949F";
}

export function colorForDriver(driverCode: string, orderedDrivers: string[]): string {
  const index = orderedDrivers.indexOf(driverCode);
  return colorForIndex(index === -1 ? orderedDrivers.length : index);
}
