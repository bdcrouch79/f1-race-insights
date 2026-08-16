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
  it("renders a season select and an event select", () => {
    render(<SeasonRaceSelector />);
    expect(screen.getByLabelText("Season")).toBeTruthy();
    expect(screen.getByLabelText("Grand Prix")).toBeTruthy();
  });

  it("defaults to a season that actually has generated races, not the current year", () => {
    const currentYear = new Date().getFullYear();
    const dataYear = String(currentYear - 2);
    render(
      <SeasonRaceSelector knownEventsBySeason={{ [dataYear]: [{ slug: "monaco-grand-prix", name: "Monaco Grand Prix" }] }} />,
    );

    expect((screen.getByLabelText("Season") as HTMLSelectElement).value).toBe(dataYear);
    expect((screen.getByLabelText("Grand Prix") as HTMLSelectElement).value).toBe("monaco-grand-prix");
  });

  it("navigates to the real race route for the selected event -- every option is a real report", () => {
    const currentYear = new Date().getFullYear();
    const dataYear = String(currentYear - 2);
    render(
      <SeasonRaceSelector knownEventsBySeason={{ [dataYear]: [{ slug: "monaco-grand-prix", name: "Monaco Grand Prix" }] }} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(push).toHaveBeenCalledTimes(1);
    const [path] = push.mock.calls[0] as [string];
    expect(path).toBe(`/race/${dataYear}/monaco-grand-prix`);
  });

  it("disables the event select and the Analyze button when the selected season has no generated races", () => {
    render(<SeasonRaceSelector />);

    expect((screen.getByLabelText("Grand Prix") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Analyze" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(push).not.toHaveBeenCalled();
  });
});
