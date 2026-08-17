import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WhatDecidedTheRace } from "@/components/WhatDecidedTheRace";
import { buildDriverInfo } from "@/lib/driverInfo";
import type { RaceAnalysis } from "@/lib/schema";

afterEach(() => cleanup());

const analysis: RaceAnalysis = {
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
    { metric: "consistency", driver: "VER", value: 0.412, unit: "seconds (standard deviation)", sampleSize: 49, methodology: "m" },
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
};

describe("WhatDecidedTheRace", () => {
  it("renders the section heading, headline stat cards, and takeaways", () => {
    const drivers = buildDriverInfo(analysis.drivers);
    render(<WhatDecidedTheRace analysis={analysis} drivers={drivers} />);

    expect(screen.getByText("What Decided The Race")).toBeTruthy();
    expect(screen.getByText("Lewis Hamilton (HAM)")).toBeTruthy();
    expect(screen.getByText("Max Verstappen (VER)")).toBeTruthy();
    expect(screen.getByText("Charles Leclerc (LEC)")).toBeTruthy();
    expect(screen.getByText(/set the fastest average race pace/)).toBeTruthy();
    expect(screen.getByText(/most repeatable/)).toBeTruthy();
    expect(screen.getByText(/gained the most pace late/)).toBeTruthy();
  });
});
