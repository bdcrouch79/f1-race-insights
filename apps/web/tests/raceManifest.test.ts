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
});
