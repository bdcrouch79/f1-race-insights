import { NextRequest, NextResponse } from "next/server";

/**
 * RaceIQ Weekend Brief signup endpoint.
 *
 * Planned integration: Brevo, list "RaceIQ Weekend Brief", sender
 * media@crouchdevelopment.com, attributes RACEIQ_SOURCE /
 * RACEIQ_FAVORITE_DRIVER / RACEIQ_FAVORITE_TEAM / RACEIQ_SIGNUP_AT.
 * See docs/GROWTH.md and docs/CURRENT_STATE.md.
 *
 * The Brevo list ID and BREVO_API_KEY secret must be verified against
 * real Brevo/Bryan OS infrastructure before this can send live
 * requests -- per the App Factory rule against inferring secret names
 * or infrastructure identifiers, this route fails safely (503, no
 * partial side effects) instead of guessing them.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SOURCES = new Set(["homepage", "race-report", "social-card", "linkedin"]);

// Best-effort per-instance rate limit. Serverless/edge deployments may
// run multiple instances with independent memory, so this is a
// defense-in-depth measure, not a durable rate limiter -- a real one
// needs a shared store (e.g. Cloudflare KV) once that infrastructure
// is provisioned deliberately.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const recentRequests = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (recentRequests.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  recentRequests.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a real visitor never fills this hidden field.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = typeof body.source === "string" ? body.source : "";
  const favoriteDriver = typeof body.favoriteDriver === "string" ? body.favoriteDriver.trim().slice(0, 80) : "";
  const favoriteTeam = typeof body.favoriteTeam === "string" ? body.favoriteTeam.trim().slice(0, 80) : "";
  const consent = body.consent === true;

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!ALLOWED_SOURCES.has(source)) {
    return NextResponse.json({ ok: false, error: "Invalid signup source." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "Consent is required to subscribe." }, { status: 400 });
  }

  const rateLimitKey = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("RaceIQ Weekend Brief signup received but BREVO_API_KEY is not configured.");
    return NextResponse.json(
      {
        ok: false,
        error: "Weekend Brief signup is not yet connected. Please try again later.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        attributes: {
          RACEIQ_SOURCE: source,
          RACEIQ_FAVORITE_DRIVER: favoriteDriver || undefined,
          RACEIQ_FAVORITE_TEAM: favoriteTeam || undefined,
          RACEIQ_SIGNUP_AT: new Date().toISOString(),
        },
        // listIds intentionally omitted: the RaceIQ Weekend Brief list ID
        // in Brevo has not been verified yet. See docs/CURRENT_STATE.md.
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("RaceIQ Weekend Brief signup failed", response.status, detail);
      return NextResponse.json({ ok: false, error: "Signup failed. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RaceIQ Weekend Brief signup error", error);
    return NextResponse.json({ ok: false, error: "Signup failed. Please try again." }, { status: 502 });
  }
}
