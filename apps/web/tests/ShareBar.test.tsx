import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShareBar } from "@/components/ShareBar";

afterEach(() => cleanup());

const URL = "https://raceiq.crouchdevelopment.com/race/2021/abu-dhabi-grand-prix";
const TITLE = "Abu Dhabi Grand Prix — RaceIQ";

describe("ShareBar", () => {
  it("always renders copy link, LinkedIn, and X controls", () => {
    render(<ShareBar url={URL} title={TITLE} />);

    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();

    const linkedIn = screen.getByRole("link", { name: "Share on LinkedIn" });
    expect(linkedIn.getAttribute("href")).toContain("linkedin.com/sharing/share-offsite");
    expect(linkedIn.getAttribute("href")).toContain(encodeURIComponent(URL));

    const x = screen.getByRole("link", { name: "Share on X" });
    expect(x.getAttribute("href")).toContain("twitter.com/intent/tweet");
    expect(x.getAttribute("href")).toContain(encodeURIComponent(URL));
  });

  it("omits the download control when no imageUrl is supplied", () => {
    render(<ShareBar url={URL} title={TITLE} />);
    expect(screen.queryByRole("link", { name: "Download graphic" })).toBeNull();
  });

  it("renders a download link to the exact imageUrl when one is supplied", () => {
    render(<ShareBar url={URL} title={TITLE} imageUrl="/content-cards/2021/abu-dhabi-grand-prix/insight-card-pace.png" />);
    const download = screen.getByRole("link", { name: "Download graphic" });
    expect(download.getAttribute("href")).toBe("/content-cards/2021/abu-dhabi-grand-prix/insight-card-pace.png");
    expect(download.hasAttribute("download")).toBe(true);
  });

  it("copies the URL to the clipboard and shows confirmation text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareBar url={URL} title={TITLE} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(URL);
    await waitFor(() => expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy());
  });
});
