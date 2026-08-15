"use client";

import { useId, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function WeekendBriefForm({ source }: { source: "homepage" | "race-report" | "social-card" | "linkedin" }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const emailId = useId();
  const driverId = useId();
  const teamId = useId();
  const consentId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          favoriteDriver: formData.get("favoriteDriver"),
          favoriteTeam: formData.get("favoriteTeam"),
          consent: formData.get("consent") === "on",
          website: formData.get("website"),
          source,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setErrorMessage(payload.error ?? "Signup failed. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Signup failed. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="riq-panel border-riq-cyan/30 p-6 text-sm">
        <p className="font-display text-lg text-riq-white">You&apos;re on the list.</p>
        <p className="mt-1 text-riq-gray">
          The RaceIQ Weekend Brief lands after each race. No spam, unsubscribe any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="riq-panel space-y-4 p-6">
      <div>
        <p className="font-display text-lg text-riq-white">RaceIQ Weekend Brief</p>
        <p className="mt-1 text-sm text-riq-gray">
          Get the data story the finishing order missed, delivered after each race.
        </p>
      </div>

      {/* Honeypot field: hidden from real visitors via CSS, left in tab order for none. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={emailId} className="mb-1 block text-xs text-riq-gray">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white placeholder:text-riq-gray/60 focus:border-riq-cyan focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={driverId} className="mb-1 block text-xs text-riq-gray">
            Favorite driver (optional)
          </label>
          <input
            id={driverId}
            name="favoriteDriver"
            type="text"
            className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={teamId} className="mb-1 block text-xs text-riq-gray">
            Favorite team (optional)
          </label>
          <input
            id={teamId}
            name="favoriteTeam"
            type="text"
            className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input id={consentId} name="consent" type="checkbox" required className="mt-1" />
        <label htmlFor={consentId} className="text-xs text-riq-gray">
          I want the RaceIQ Weekend Brief by email and agree to the{" "}
          <a href="/methodology" className="underline underline-offset-2 hover:text-riq-white">
            privacy notes in RaceIQ&apos;s methodology
          </a>
          .
        </label>
      </div>

      {status === "error" && errorMessage ? (
        <p role="alert" className="text-sm text-riq-red">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-riq-red px-4 py-2.5 text-sm font-medium text-riq-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
