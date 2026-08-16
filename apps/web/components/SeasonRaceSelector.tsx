"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LAP_TIMING_MIN_SEASON } from "@/lib/availability";
import { slugify } from "@/lib/slug";

const CURRENT_SEASON = new Date().getFullYear();
const SEASONS = Array.from(
  { length: CURRENT_SEASON - LAP_TIMING_MIN_SEASON + 1 },
  (_, i) => CURRENT_SEASON - i,
);

interface SeasonRaceSelectorProps {
  /**
   * Real generated event slugs, keyed by season. Lets a loose query like
   * "monaco" resolve to the actual "monaco-grand-prix" report instead of
   * navigating to a guessed slug that was never generated -- which would
   * otherwise 404 even for races RaceIQ has already analyzed.
   */
  knownEventsBySeason?: Record<string, string[]>;
}

export function SeasonRaceSelector({ knownEventsBySeason = {} }: SeasonRaceSelectorProps) {
  const router = useRouter();
  const [season, setSeason] = useState(SEASONS[0]);
  const [event, setEvent] = useState("");

  function resolveEventSlug(query: string): string {
    const guess = slugify(query);
    const known = knownEventsBySeason[String(season)] ?? [];
    const matches = known.filter((slug) => slug === guess || slug.includes(guess));
    return matches.length === 1 ? (matches[0] ?? guess) : guess;
  }

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!event.trim()) return;
    router.push(`/race/${season}/${resolveEventSlug(event)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="riq-panel grid grid-cols-1 items-end gap-3 p-5 sm:grid-cols-[160px_1fr_auto]"
    >
      <div>
        <label htmlFor="riq-season" className="mb-1 block text-xs text-riq-gray">
          Season
        </label>
        <select
          id="riq-season"
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none"
        >
          {SEASONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="riq-event" className="mb-1 block text-xs text-riq-gray">
          Grand Prix
        </label>
        <input
          id="riq-event"
          type="text"
          required
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="e.g. Monaco, Silverstone, Monza"
          className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white placeholder:text-riq-gray/60 focus:border-riq-cyan focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-riq-red px-5 py-2.5 text-sm font-medium text-riq-white transition-opacity hover:opacity-90"
      >
        Analyze
      </button>
      <p className="text-xs text-riq-gray sm:col-span-3">
        RaceIQ only supports seasons {LAP_TIMING_MIN_SEASON}–{CURRENT_SEASON} with lap-timing data,
        and only races that have already been generated will show a full report. See{" "}
        <a href="/archive" className="underline underline-offset-2 hover:text-riq-white">
          the archive
        </a>{" "}
        for what&apos;s available now.
      </p>
    </form>
  );
}
