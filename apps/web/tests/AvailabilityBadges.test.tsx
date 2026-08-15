import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";

afterEach(() => cleanup());

describe("AvailabilityBadges", () => {
  it("marks unavailable metrics distinctly from available ones", () => {
    render(
      <AvailabilityBadges
        availability={{ lapTiming: true, telemetry: false, tireCompounds: true, weather: false }}
      />,
    );

    expect(screen.getByText("Lap timing").closest("li")?.textContent).toContain("available");
    expect(screen.getAllByText("not available")).toHaveLength(2);
    expect(screen.getAllByText("available", { exact: false })).toBeTruthy();
  });

  it("renders all four availability categories", () => {
    render(
      <AvailabilityBadges
        availability={{ lapTiming: true, telemetry: true, tireCompounds: true, weather: true }}
      />,
    );
    for (const label of ["Lap timing", "Telemetry", "Tire compounds", "Weather"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
