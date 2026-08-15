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

  it("does not navigate when the event field is empty", () => {
    render(<SeasonRaceSelector />);
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(push).not.toHaveBeenCalled();
  });
});
