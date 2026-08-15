import { describe, expect, it } from "vitest";

import { driverLabel, formatDelta, formatLapTime, formatSeconds } from "@/lib/format";

describe("formatLapTime", () => {
  it("formats seconds as m:ss.mmm", () => {
    expect(formatLapTime(76.4)).toBe("1:16.400");
  });

  it("handles sub-minute values", () => {
    expect(formatLapTime(59.999)).toBe("0:59.999");
  });
});

describe("formatDelta", () => {
  it("adds a plus sign for positive deltas", () => {
    expect(formatDelta(0.5)).toBe("+0.500s");
  });

  it("uses a minus sign for negative deltas", () => {
    expect(formatDelta(-0.5)).toBe("−0.500s");
  });

  it("has no sign for zero", () => {
    expect(formatDelta(0)).toBe("0.000s");
  });
});

describe("formatSeconds", () => {
  it("formats to the requested precision", () => {
    expect(formatSeconds(1.23456, 2)).toBe("1.23s");
  });
});

describe("driverLabel", () => {
  it("includes the code when a full name is known", () => {
    expect(driverLabel({ code: "AAA", fullName: "Driver AAA" })).toBe("Driver AAA (AAA)");
  });

  it("falls back to just the code", () => {
    expect(driverLabel({ code: "AAA", fullName: "AAA" })).toBe("AAA");
  });
});
