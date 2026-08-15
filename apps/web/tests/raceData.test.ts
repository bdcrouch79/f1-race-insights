import { describe, expect, it } from "vitest";

import { DEMO_FIXTURE_ROUTE, loadDemoFixture, resolveAnalysis, slugify } from "@/lib/raceData";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Monaco Grand Prix")).toBe("monaco-grand-prix");
  });

  it("strips punctuation", () => {
    expect(slugify("São Paulo!!")).toBe("s-o-paulo");
  });
});

describe("resolveAnalysis", () => {
  it("resolves the demo fixture route", () => {
    const analysis = resolveAnalysis(DEMO_FIXTURE_ROUTE.year, DEMO_FIXTURE_ROUTE.eventSlug);
    const demo = loadDemoFixture();

    expect(analysis).not.toBeNull();
    expect(analysis?.dataSource).toBe("demo-fixture");
    expect(analysis?.event.name).toBe(demo?.event.name);
  });

  it("returns null for an unknown race (unavailable state)", () => {
    const analysis = resolveAnalysis("1999", "not-a-real-race");
    expect(analysis).toBeNull();
  });

  it("does not serve the demo fixture for a different year/slug", () => {
    const analysis = resolveAnalysis("2024", DEMO_FIXTURE_ROUTE.eventSlug);
    expect(analysis).toBeNull();
  });
});
