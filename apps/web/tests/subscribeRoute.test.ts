import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/subscribe/route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("https://raceiq.crouchdevelopment.com/api/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: "reader@example.com",
  consent: true,
  source: "homepage",
  website: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/subscribe", () => {
  it("rejects an invalid email without touching any secret", async () => {
    const response = await POST(makeRequest({ ...validBody, email: "not-an-email" }));
    expect(response.status).toBe(400);
  });

  it("rejects a missing consent flag", async () => {
    const response = await POST(makeRequest({ ...validBody, consent: false }));
    expect(response.status).toBe(400);
  });

  it("silently accepts (no-ops) when the honeypot field is filled", async () => {
    const response = await POST(makeRequest({ ...validBody, website: "http://spam.example" }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ ok: true });
  });

  it("fails safely with 503 when BREVO_API_KEY is not configured", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
  });
});
