import { describe, expect, it } from "vitest";

import { findManifestEntry } from "@/lib/raceManifest";

describe("findManifestEntry", () => {
  it("matches the real committed 2024 Monaco Grand Prix by year and resolved event name", () => {
    const entry = findManifestEntry("2024", "Monaco Grand Prix");
    expect(entry).not.toBeNull();
    expect(entry?.displayName).toBe("2024 Monaco Grand Prix");
    expect(entry?.featured).toBe(true);
    expect(entry?.category.length).toBeGreaterThan(0);
    expect(entry?.description.length).toBeGreaterThan(0);
  });

  it("returns null when no manifest entry matches the year", () => {
    expect(findManifestEntry("1999", "Monaco Grand Prix")).toBeNull();
  });

  it("returns null when no manifest entry matches the event name", () => {
    expect(findManifestEntry("2024", "Not A Real Grand Prix")).toBeNull();
  });

  // Regression coverage: these manifest queries are country names
  // ("Germany", "Italy", "Turkey", "Netherlands", "Britain") but
  // FastF1's real EventName uses the demonym/adjective form instead
  // ("German", "Italian", "Turkish", "Dutch", "British"), so a plain
  // substring check never matched -- these races silently lost their
  // category/featured/description. See EVENT_NAME_ALIASES in
  // lib/raceManifest.ts and docs/DECISIONS.md.
  it.each([
    ["2018", "German Grand Prix"],
    ["2019", "German Grand Prix"],
    ["2019", "Italian Grand Prix"],
    ["2020", "Italian Grand Prix"],
    ["2020", "Turkish Grand Prix"],
    ["2021", "British Grand Prix"],
    ["2023", "Dutch Grand Prix"],
  ])("matches a demonym real event name for %s %s", (year, eventName) => {
    expect(findManifestEntry(year, eventName)).not.toBeNull();
  });
});
