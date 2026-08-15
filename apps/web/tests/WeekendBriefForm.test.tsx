import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WeekendBriefForm } from "@/components/WeekendBriefForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@example.com" } });
  fireEvent.click(screen.getByLabelText(/I want the RaceIQ Weekend Brief/));
}

describe("WeekendBriefForm", () => {
  it("shows a success state after a successful signup", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }),
    );

    render(<WeekendBriefForm source="homepage" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => expect(screen.getByText("You're on the list.")).toBeTruthy());
  });

  it("shows the server's error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false, error: "Weekend Brief signup is not yet connected. Please try again later." }),
      }),
    );

    render(<WeekendBriefForm source="homepage" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Weekend Brief signup is not yet connected"),
    );
  });

  it("sends the honeypot field to the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<WeekendBriefForm source="race-report" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body).toHaveProperty("website");
    expect(body.source).toBe("race-report");
  });
});
