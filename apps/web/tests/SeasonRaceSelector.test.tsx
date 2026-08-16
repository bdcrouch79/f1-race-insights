import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { SeasonRaceSelector } from "@/components/SeasonRaceSelector";

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("SeasonRaceSelector", () => {
  it("renders a season select and an event input", () => {
    render(<SeasonRaceSelector />);
    expect(screen.getByLabelText("Season")).toBeTruthy();
    expect(screen.getByLabelText("Grand Prix")).toBeTruthy();
  });

  it("navigates to the slugified race route on submit", () => {
    render(<SeasonRaceSelector />);

    fireEvent.change(screen.getByLabelText("Grand Prix"), { target: { value: "Monaco Grand Prix" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(push).toHaveBeenCalledTimes(1);
    const [path] = push.mock.calls[0] as [string];
    expect(path).toMatch(/^\/race\/\d{4}\/monaco-grand-prix$/);
  });

  it("resolves a partial query against a known event slug for the selected season", () => {
    const currentYear = new Date().getFullYear();
    render(<SeasonRaceSelector knownEventsBySeason={{ [String(currentYear)]: ["monaco-grand-prix"] }} />);

    fireEvent.change(screen.getByLabelText("Grand Prix"), { target: { value: "monaco" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(push).toHaveBeenCalledTimes(1);
    const [path] = push.mock.calls[0] as [string];
    expect(path).toBe(`/race/${currentYear}/monaco-grand-prix`);
  });

  it("falls back to the raw slug when no known event matches, instead of guessing ambiguously", () => {
    const currentYear = new Date().getFullYear();
    render(
      <SeasonRaceSelector
        knownEventsBySeason={{ [String(currentYear)]: ["japanese-grand-prix", "abu-dhabi-grand-prix"] }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Grand Prix"), { target: { value: "monaco" } });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    const [path] = push.mock.calls[0] as [string];
    expect(path).toBe(`/race/${currentYear}/monaco`);
  });

  it("does not navigate when the event field is empty", () => {
    render(<SeasonRaceSelector />);
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(push).not.toHaveBeenCalled();
  });
});
