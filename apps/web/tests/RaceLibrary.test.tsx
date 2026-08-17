import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RaceLibrary } from "@/components/RaceLibrary";
import type { LibraryRaceEntry } from "@/lib/raceInsight";
import type { RaceAnalysis } from "@/lib/schema";

afterEach(() => cleanup());

function analysis(overrides: Partial<RaceAnalysis>): RaceAnalysis {
  return {
    analysisVersion: "1.1.1",
    generatedAt: "2026-08-16T00:00:00+00:00",
    dataSource: "generated",
    event: { year: 2024, round: 1, name: "Placeholder Grand Prix", session: "R", date: null, circuit: "Placeholder Circuit" },
    availability: { lapTiming: true, telemetry: true, tireCompounds: true, weather: true },
    summary: { fastestAveragePaceDriver: null, mostConsistentDriver: null, strongestLateRaceDriver: null, largestPaceDeclineDriver: null },
    evidence: [],
    drivers: [],
    paceRanking: [],
    lapTrends: [],
    consistency: [],
    degradation: [],
    methodology: {},
    warnings: [],
    ...overrides,
  };
}

const ENTRIES: LibraryRaceEntry[] = [
  {
    year: "2021",
    eventSlug: "abu-dhabi-grand-prix",
    category: "title-decider",
    featured: true,
    analysis: analysis({
      event: { year: 2021, round: 22, name: "Abu Dhabi Grand Prix", session: "R", date: null, circuit: "Yas Marina" },
      drivers: [{ code: "VER", fullName: "Max Verstappen", team: "Red Bull Racing", teamColor: "#3671C6" }],
    }),
  },
  {
    year: "2023",
    eventSlug: "las-vegas-grand-prix",
    category: "new-circuit",
    featured: true,
    analysis: analysis({
      event: { year: 2023, round: 22, name: "Las Vegas Grand Prix", session: "R", date: null, circuit: "Las Vegas" },
      drivers: [{ code: "HAM", fullName: "Lewis Hamilton", team: "Mercedes", teamColor: "#27F4D2" }],
    }),
  },
  {
    year: "2019",
    eventSlug: "italian-grand-prix",
    category: "high-speed-circuit",
    featured: false,
    analysis: analysis({
      event: { year: 2019, round: 14, name: "Italian Grand Prix", session: "R", date: null, circuit: "Monza" },
      drivers: [{ code: "LEC", fullName: "Charles Leclerc", team: "Ferrari", teamColor: "#E8002D" }],
    }),
  },
];

describe("RaceLibrary", () => {
  it("renders a card for every entry", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    expect(screen.getByText("Abu Dhabi Grand Prix")).toBeTruthy();
    expect(screen.getByText("Las Vegas Grand Prix")).toBeTruthy();
    expect(screen.getByText("Italian Grand Prix")).toBeTruthy();
  });

  it("only lists seasons that actually appear in the entries", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    const seasonSelect = screen.getByLabelText("Season") as HTMLSelectElement;
    const values = Array.from(seasonSelect.options).map((o) => o.value);
    expect(values).toEqual(["all", "2023", "2021", "2019"]);
  });

  it("filters by season", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.change(screen.getByLabelText("Season"), { target: { value: "2019" } });
    expect(screen.getByText("Italian Grand Prix")).toBeTruthy();
    expect(screen.queryByText("Abu Dhabi Grand Prix")).toBeNull();
  });

  it("filters by category", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "new-circuit" } });
    expect(screen.getByText("Las Vegas Grand Prix")).toBeTruthy();
    expect(screen.queryByText("Abu Dhabi Grand Prix")).toBeNull();
  });

  it("filters by driver", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.change(screen.getByLabelText("Driver"), { target: { value: "LEC" } });
    expect(screen.getByText("Italian Grand Prix")).toBeTruthy();
    expect(screen.queryByText("Las Vegas Grand Prix")).toBeNull();
  });

  it("filters to featured races only", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.click(screen.getByRole("button", { name: /Featured only/ }));
    expect(screen.getByText("Abu Dhabi Grand Prix")).toBeTruthy();
    expect(screen.getByText("Las Vegas Grand Prix")).toBeTruthy();
    expect(screen.queryByText("Italian Grand Prix")).toBeNull();
  });

  it("filters by search query", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.change(screen.getByLabelText("Search by Grand Prix name"), { target: { value: "vegas" } });
    expect(screen.getByText("Las Vegas Grand Prix")).toBeTruthy();
    expect(screen.queryByText("Abu Dhabi Grand Prix")).toBeNull();
  });

  it("shows an empty-state message when no race matches the filters", () => {
    render(<RaceLibrary entries={ENTRIES} />);
    fireEvent.change(screen.getByLabelText("Search by Grand Prix name"), { target: { value: "not a real race" } });
    expect(screen.getByText("No races match these filters.")).toBeTruthy();
  });
});
