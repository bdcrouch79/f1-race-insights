import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Hero } from "@/components/Hero";

afterEach(() => cleanup());

describe("Hero", () => {
  it("renders the required hero message and an accurate call to action", () => {
    render(<Hero raceCount={20} seasonRange="2018-2024" />);

    expect(screen.getByText("The finishing order tells you who won.")).toBeTruthy();
    expect(screen.getByText("RaceIQ shows you how the race was won.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Explore Race Intelligence" })).toBeTruthy();
    // No language implying arbitrary/on-demand generation.
    expect(screen.queryByText(/generate/i)).toBeNull();
    expect(screen.queryByText(/analyze a race/i)).toBeNull();
  });

  it("shows the real race count and season range", () => {
    render(<Hero raceCount={20} seasonRange="2018-2024" />);
    expect(screen.getByText(/20 Grand Prix analyzed/)).toBeTruthy();
    expect(screen.getByText(/2018-2024/)).toBeTruthy();
  });
});
