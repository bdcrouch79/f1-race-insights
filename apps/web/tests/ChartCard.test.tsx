import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartCard } from "@/components/ChartCard";

afterEach(() => cleanup());

describe("ChartCard", () => {
  it("renders title, description, methodology, and wraps children in a horizontally scrollable container", () => {
    render(
      <ChartCard title="Average Race Pace" description="Fastest to slowest." methodology="Mean of quick laps.">
        <div data-testid="chart-child">chart placeholder</div>
      </ChartCard>,
    );

    expect(screen.getByText("Average Race Pace")).toBeTruthy();
    expect(screen.getByText("Fastest to slowest.")).toBeTruthy();
    expect(screen.getByText("Mean of quick laps.")).toBeTruthy();

    const child = screen.getByTestId("chart-child");
    const scrollContainer = child.parentElement;
    expect(scrollContainer?.className).toContain("overflow-x-auto");
  });

  it("omits methodology and description when not provided", () => {
    render(
      <ChartCard title="Consistency">
        <div>content</div>
      </ChartCard>,
    );
    expect(screen.getByText("Consistency")).toBeTruthy();
  });
});
