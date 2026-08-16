import { describe, expect, it } from "vitest";

import { filterEligibleForHeadline } from "@/lib/headlineEligibility";

describe("filterEligibleForHeadline", () => {
  it("excludes a driver with a sample under half the field's largest", () => {
    const rows = [
      { driver: "SAR", sampleSize: 14 },
      { driver: "HAM", sampleSize: 50 },
      { driver: "VER", sampleSize: 49 },
    ];

    const eligible = filterEligibleForHeadline(rows, "sampleSize");

    expect(eligible.map((r) => r.driver)).toEqual(["HAM", "VER"]);
  });

  it("preserves input order (callers rely on this for 'fastest first')", () => {
    const rows = [
      { driver: "A", sampleSize: 50 },
      { driver: "B", sampleSize: 49 },
    ];
    expect(filterEligibleForHeadline(rows, "sampleSize").map((r) => r.driver)).toEqual(["A", "B"]);
  });

  it("falls back to the full list when everyone has a short sample", () => {
    const rows = [
      { driver: "A", sampleSize: 4 },
      { driver: "B", sampleSize: 3 },
    ];
    expect(filterEligibleForHeadline(rows, "sampleSize")).toEqual(rows);
  });

  it("handles an empty list", () => {
    expect(filterEligibleForHeadline([], "sampleSize" as never)).toEqual([]);
  });
});
