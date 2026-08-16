/**
 * Frontend mirror of analysis/raceiq/narrative.py's
 * `_eligible_for_headline`. A driver with very few quick laps relative
 * to the field (typically an early retirement) can dominate a raw
 * ranking on a handful of clean laps before their incident -- real
 * Monaco 2024 data proved this (Logan Sargeant, 14 laps vs. a field
 * high of 50). The engine already keeps unqualified headline picks
 * (summary.*) out of the contract, but any frontend surface that
 * independently re-derives a "top N" from the full paceRanking table
 * (like the social card) must apply the same filter, or it can
 * contradict its own headline -- which is exactly what the social card
 * did before this existed: it stated "Hamilton led average race pace"
 * in text while showing Sargeant's bar as the fastest above it.
 *
 * Keep MIN_HEADLINE_SAMPLE_RATIO in sync with
 * analysis/raceiq/narrative.py::MIN_HEADLINE_SAMPLE_RATIO.
 */
export const MIN_HEADLINE_SAMPLE_RATIO = 0.5;

export function filterEligibleForHeadline<T>(rows: T[], sampleKey: keyof T): T[] {
  if (rows.length === 0) return rows;
  const typical = Math.max(...rows.map((row) => Number(row[sampleKey])));
  const threshold = typical * MIN_HEADLINE_SAMPLE_RATIO;
  const eligible = rows.filter((row) => Number(row[sampleKey]) >= threshold);
  return eligible.length > 0 ? eligible : rows;
}
