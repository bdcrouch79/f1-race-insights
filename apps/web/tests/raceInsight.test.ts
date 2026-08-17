import { describe, expect, it } from "vitest";

import { buildDriverInfo } from "@/lib/driverInfo";
import { findEvidence, getPrimaryInsight, getTakeaways, pickFeaturedRace, type LibraryRaceEntry } from "@/lib/raceInsight";
import type { RaceAnalysis } from "@/lib/schema";

function buildAnalysis(overrides: Partial<RaceAnalysis> = {}): RaceAnalysis {
  return {
    analysisVersion: "1.1.1",
    generatedAt: "2026-08-16T00:00:00+00:00",
    dataSource: "generated",
    event: { year: 2024, round: 8, name: "Monaco Grand Prix", session: "R", date: "2024-05-26", circuit: "Monaco" },
    availability: { lapTiming: true, telemetry: true, tireCompounds: true, weather: true },
    summary: {
      fastestAveragePaceDriver: "HAM",
      mostConsistentDriver: "VER",
      strongestLateRaceDriver: "LEC",
      largestPaceDeclineDriver: null,
    },
    evidence: [
      { metric: "averagePace", driver: "HAM", value: 76.233, unit: "seconds", sampleSize: 50, methodology: "m" },
      {
        metric: "consistency",
        driver: "VER",
        value: 0.412,
        unit: "seconds (standard deviation)",
        sampleSize: 49,
        methodology: "m",
      },
      { metric: "degradation", driver: "LEC", value: -0.55, unit: "seconds", sampleSize: 45, methodology: "m" },
    ],
    drivers: [
      { code: "HAM", fullName: "Lewis Hamilton", team: "Mercedes", teamColor: "#27F4D2" },
      { code: "VER", fullName: "Max Verstappen", team: "Red Bull Racing", teamColor: "#3671C6" },
      { code: "LEC", fullName: "Charles Leclerc", team: "Ferrari", teamColor: "#E8002D" },
    ],
    paceRanking: [],
    lapTrends: [],
    consistency: [],
    degradation: [],
    methodology: {},
    warnings: [],
    ...overrides,
  };
}

describe("findEvidence", () => {
  it("finds the matching metric/driver pair", () => {
    const analysis = buildAnalysis();
    const evidence = findEvidence(analysis.evidence, "averagePace", "HAM");
    expect(evidence?.value).toBe(76.233);
  });

  it("returns undefined for a null driver", () => {
    const analysis = buildAnalysis();
    expect(findEvidence(analysis.evidence, "averagePace", null)).toBeUndefined();
  });
});

describe("getPrimaryInsight", () => {
  it("prefers the fastest-average-pace headline when present", () => {
    const analysis = buildAnalysis();
    const drivers = buildDriverInfo(analysis.drivers);
    expect(getPrimaryInsight(analysis, drivers)).toBe("Lewis Hamilton (HAM) led average race pace at 76.233s per lap.");
  });

  it("falls back to consistency when no pace headline exists", () => {
    const analysis = buildAnalysis({ summary: { fastestAveragePaceDriver: null, mostConsistentDriver: "VER", strongestLateRaceDriver: null, largestPaceDeclineDriver: null } });
    const drivers = buildDriverInfo(analysis.drivers);
    expect(getPrimaryInsight(analysis, drivers)).toContain("most consistent");
  });

  it("falls back to a plain driver count when no headline is available at all", () => {
    const analysis = buildAnalysis({
      summary: { fastestAveragePaceDriver: null, mostConsistentDriver: null, strongestLateRaceDriver: null, largestPaceDeclineDriver: null },
    });
    const drivers = buildDriverInfo(analysis.drivers);
    expect(getPrimaryInsight(analysis, drivers)).toBe("3 drivers analyzed across the full race distance.");
  });
});

describe("getTakeaways", () => {
  it("uses the decline headline as the third takeaway when one exists", () => {
    const analysis = buildAnalysis({
      summary: { fastestAveragePaceDriver: "HAM", mostConsistentDriver: "VER", strongestLateRaceDriver: "LEC", largestPaceDeclineDriver: "LEC" },
      evidence: [
        { metric: "averagePace", driver: "HAM", value: 76.233, unit: "seconds", sampleSize: 50, methodology: "m" },
        { metric: "consistency", driver: "VER", value: 0.412, unit: "seconds (standard deviation)", sampleSize: 49, methodology: "m" },
        { metric: "degradation", driver: "LEC", value: 0.3, unit: "seconds", sampleSize: 45, methodology: "m" },
      ],
    });
    const drivers = buildDriverInfo(analysis.drivers);
    const takeaways = getTakeaways(analysis, drivers);
    expect(takeaways).toHaveLength(3);
    expect(takeaways.at(2)?.id).toBe("decline");
    expect(takeaways.at(2)?.text).toContain("lost the most pace late");
  });

  it("falls back to the closing-pace headline when no decline exists", () => {
    const analysis = buildAnalysis();
    const drivers = buildDriverInfo(analysis.drivers);
    const takeaways = getTakeaways(analysis, drivers);
    expect(takeaways).toHaveLength(3);
    expect(takeaways.at(2)?.id).toBe("closing");
    expect(takeaways.at(2)?.text).toContain("gained the most pace late");
  });

  it("never fabricates a takeaway for a metric with no evidence entry", () => {
    const analysis = buildAnalysis({
      summary: { fastestAveragePaceDriver: "HAM", mostConsistentDriver: null, strongestLateRaceDriver: null, largestPaceDeclineDriver: null },
      evidence: [{ metric: "averagePace", driver: "HAM", value: 76.233, unit: "seconds", sampleSize: 50, methodology: "m" }],
    });
    const drivers = buildDriverInfo(analysis.drivers);
    expect(getTakeaways(analysis, drivers)).toHaveLength(1);
  });
});

describe("pickFeaturedRace", () => {
  function entry(year: string, featured: boolean): LibraryRaceEntry {
    return { year, eventSlug: `race-${year}`, analysis: buildAnalysis({ event: { ...buildAnalysis().event, year: Number(year) } }), featured };
  }

  it("returns null for an empty list", () => {
    expect(pickFeaturedRace([])).toBeNull();
  });

  it("picks the most recent featured race", () => {
    const entries = [entry("2019", true), entry("2024", true), entry("2021", false)];
    expect(pickFeaturedRace(entries)?.year).toBe("2024");
  });

  it("falls back to the most recent race when none are featured", () => {
    const entries = [entry("2019", false), entry("2024", false), entry("2021", false)];
    expect(pickFeaturedRace(entries)?.year).toBe("2024");
  });
});
