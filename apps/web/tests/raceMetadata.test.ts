import { describe, expect, it } from "vitest";

import { generateMetadata } from "@/app/race/[year]/[event]/page";
import { DEMO_FIXTURE_ROUTE } from "@/lib/raceData";

describe("race report generateMetadata", () => {
  it("marks an unknown race as noindex with an honest title", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ year: "1999", event: "not-a-real-race" }) });
    expect(metadata.title).toBe("Analysis not available");
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("marks the sample/demo report as noindex but still describes it", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ year: DEMO_FIXTURE_ROUTE.year, event: DEMO_FIXTURE_ROUTE.eventSlug }),
    });
    expect(metadata.robots).toMatchObject({ index: false });
    expect(String(metadata.title)).toContain("RaceIQ");
  });
});
