import { driverLabel } from "@/lib/format";
import type { DriverInfo } from "@/lib/driverInfo";
import type { EvidenceItem, RaceAnalysis } from "@/lib/schema";

/**
 * Editorial framing derived entirely from an already-computed
 * RaceAnalysis (summary + evidence). Nothing here computes a new
 * metric or invents a claim -- every sentence traces back to a
 * `summary` headline and its `evidence` entry, the same contract the
 * race report itself renders. See docs/METHODOLOGY.md and
 * docs/DECISIONS.md.
 */

/** A race the library can show: a real generated analysis, optionally joined to its manifest entry. */
export interface LibraryRaceEntry {
  year: string;
  eventSlug: string;
  analysis: RaceAnalysis;
  category?: string;
  featured?: boolean;
  description?: string;
}

export function findEvidence(evidence: EvidenceItem[], metric: string, driver: string | null): EvidenceItem | undefined {
  if (!driver) return undefined;
  return evidence.find((item) => item.metric === metric && item.driver === driver);
}

function nameFor(drivers: DriverInfo, code: string | null): string {
  if (!code) return "";
  const driver = drivers[code];
  return driver ? driverLabel(driver) : code;
}

/**
 * One evidence-backed sentence describing a race, for a library card or
 * the featured spotlight. Prefers the same headline order the race
 * report leads with (pace, then consistency, then closing pace), and
 * falls back to a plain, still-factual driver count if a session
 * somehow produced no headline at all (not observed in any of the 20
 * currently generated races, but the engine's contract allows it).
 */
export function getPrimaryInsight(analysis: RaceAnalysis, drivers: DriverInfo): string {
  const { summary, evidence } = analysis;

  const paceEvidence = findEvidence(evidence, "averagePace", summary.fastestAveragePaceDriver);
  if (paceEvidence) {
    return `${nameFor(drivers, summary.fastestAveragePaceDriver)} led average race pace at ${paceEvidence.value.toFixed(3)}s per lap.`;
  }

  const consistencyEvidence = findEvidence(evidence, "consistency", summary.mostConsistentDriver);
  if (consistencyEvidence) {
    return `${nameFor(drivers, summary.mostConsistentDriver)} was the most consistent, a ${consistencyEvidence.value.toFixed(3)}s lap-time spread.`;
  }

  const closingEvidence = findEvidence(evidence, "degradation", summary.strongestLateRaceDriver);
  if (closingEvidence) {
    return closingEvidence.value < 0
      ? `${nameFor(drivers, summary.strongestLateRaceDriver)} gained ${Math.abs(closingEvidence.value).toFixed(3)}s per lap in the closing stint.`
      : `${nameFor(drivers, summary.strongestLateRaceDriver)} held pace best in the closing stint.`;
  }

  return `${analysis.drivers.length} drivers analyzed across the full race distance.`;
}

export interface Takeaway {
  id: string;
  text: string;
}

/**
 * Up to three evidence-backed takeaways for the race report's "What
 * Decided The Race" section. Pace and consistency are populated for
 * every real race generated so far; the third slot prefers a genuine
 * pace decline (only true for a minority of races -- see
 * docs/METHODOLOGY.md's headline-eligibility section) and falls back
 * to the closing-pace headline, which every real race does have.
 */
export function getTakeaways(analysis: RaceAnalysis, drivers: DriverInfo): Takeaway[] {
  const { summary, evidence } = analysis;
  const takeaways: Takeaway[] = [];

  const paceEvidence = findEvidence(evidence, "averagePace", summary.fastestAveragePaceDriver);
  if (paceEvidence) {
    takeaways.push({
      id: "pace",
      text: `${nameFor(drivers, summary.fastestAveragePaceDriver)} set the fastest average race pace: ${paceEvidence.value.toFixed(3)}s per lap across ${paceEvidence.sampleSize} quick laps.`,
    });
  }

  const consistencyEvidence = findEvidence(evidence, "consistency", summary.mostConsistentDriver);
  if (consistencyEvidence) {
    takeaways.push({
      id: "consistency",
      text: `${nameFor(drivers, summary.mostConsistentDriver)} was the most repeatable, with a lap-time spread of just ${consistencyEvidence.value.toFixed(3)}s over ${consistencyEvidence.sampleSize} quick laps.`,
    });
  }

  const declineEvidence = findEvidence(evidence, "degradation", summary.largestPaceDeclineDriver);
  if (declineEvidence) {
    takeaways.push({
      id: "decline",
      text: `${nameFor(drivers, summary.largestPaceDeclineDriver)} lost the most pace late: ${declineEvidence.value.toFixed(3)}s per lap slower in the closing stint than the opening one.`,
    });
  } else {
    const closingEvidence = findEvidence(evidence, "degradation", summary.strongestLateRaceDriver);
    if (closingEvidence) {
      takeaways.push({
        id: "closing",
        text:
          closingEvidence.value < 0
            ? `${nameFor(drivers, summary.strongestLateRaceDriver)} gained the most pace late: ${Math.abs(closingEvidence.value).toFixed(3)}s per lap faster in the closing stint than the opening one.`
            : `${nameFor(drivers, summary.strongestLateRaceDriver)} lost the least pace late in the race, ${closingEvidence.value.toFixed(3)}s per lap in the closing stint.`,
      });
    }
  }

  return takeaways.slice(0, 3);
}

/**
 * Pick one race for the homepage spotlight: the most recent manifest-
 * featured race with a real generated analysis. Falls back to the most
 * recent generated race of any kind if none is marked featured, so the
 * homepage never has an empty spotlight while any real race exists.
 */
export function pickFeaturedRace(entries: LibraryRaceEntry[]): LibraryRaceEntry | null {
  if (entries.length === 0) return null;
  const byRecency = [...entries].sort((a, b) => Number(b.year) - Number(a.year));
  const featured = byRecency.filter((entry) => entry.featured);
  return featured[0] ?? byRecency[0] ?? null;
}
