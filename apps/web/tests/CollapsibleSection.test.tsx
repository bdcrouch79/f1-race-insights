import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CollapsibleSection } from "@/components/CollapsibleSection";

afterEach(() => cleanup());

describe("CollapsibleSection", () => {
  it("is collapsed by default but keeps its content in the DOM", () => {
    render(
      <CollapsibleSection title="Evidence & Methodology">
        <p>Secondary detail</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText("Evidence & Methodology")).toBeTruthy();
    const details = screen.getByText("Secondary detail").closest("details");
    expect(details?.open).toBe(false);
  });

  it("renders open when defaultOpen is set", () => {
    render(
      <CollapsibleSection title="Open by default" defaultOpen>
        <p>Visible detail</p>
      </CollapsibleSection>,
    );
    const details = screen.getByText("Visible detail").closest("details");
    expect(details?.open).toBe(true);
  });
});
