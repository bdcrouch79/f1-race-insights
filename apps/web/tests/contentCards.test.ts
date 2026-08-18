import { describe, expect, it } from "vitest";

import { contentCardUrl, hasContentCard } from "@/lib/contentCards";

describe("contentCards", () => {
  it("reports a content card as available for the real generated 2021 Abu Dhabi Grand Prix package", () => {
    expect(hasContentCard("2021", "abu-dhabi-grand-prix")).toBe(true);
  });

  it("reports no content card for a race that hasn't had content generated", () => {
    expect(hasContentCard("2024", "monaco-grand-prix")).toBe(false);
  });

  it("builds the exact static asset URL build-data.mjs copies the card to", () => {
    expect(contentCardUrl("2021", "abu-dhabi-grand-prix")).toBe(
      "/content-cards/2021/abu-dhabi-grand-prix/insight-card-pace.png",
    );
  });
});
