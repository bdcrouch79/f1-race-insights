import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { raceAnalysisSchema } from "@/lib/schema";

/**
 * Integration test: validates a real engine-generated fixture (produced
 * by scripts/generate_demo_fixture.py from the Python analysis engine)
 * against the frontend's independent zod schema. This is RaceIQ's
 * "engine output validates against frontend schema" check.
 */
describe("raceAnalysisSchema against the demo fixture", () => {
  it("accepts the engine-generated demo fixture", () => {
    const fixturePath = path.resolve(__dirname, "..", "..", "..", "data", "fixtures", "demo-race.json");
    const raw = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

    const result = raceAnalysisSchema.safeParse(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dataSource).toBe("demo-fixture");
      expect(result.data.paceRanking.length).toBeGreaterThan(0);
      expect(result.data.summary.fastestAveragePaceDriver).toBeTruthy();
    }
  });

  it("rejects a payload missing required fields", () => {
    const result = raceAnalysisSchema.safeParse({ analysisVersion: "1.0.0" });
    expect(result.success).toBe(false);
  });
});
