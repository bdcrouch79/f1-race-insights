"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LAP_TIMING_MIN_SEASON } from "@/lib/availability";

const CURRENT_SEASON = new Date().getFullYear();
const SEASONS = Array.from(
  { length: CURRENT_SEASON - LAP_TIMING_MIN_SEASON + 1 },
  (_, i) => CURRENT_SEASON - i,
);

export interface KnownEvent {
  slug: string;
  name: string;
}

interface SeasonRaceSelectorProps {
  /**
   * Real generated races, keyed by season. This is a picker over what
   * actually exists, not a free-text guess at a slug -- there is no
   * combination this form can submit that isn't already a real report,
   * so it can never send anyone to a 404.
   */
  knownEventsBySeason?: Record<string, KnownEvent[]>;
}

export function SeasonRaceSelector({ knownEventsBySeason = {} }: SeasonRaceSelectorProps) {
  const router = useRouter();
  const seasonsWithData = useMemo(
    () => SEASONS.filter((year) => (knownEventsBySeason[String(year)]?.length ?? 0) > 0),
    [knownEventsBySeason],
  );
  const [season, setSeason] = useState(seasonsWithData[0] ?? SEASONS[0]);
  const events = knownEventsBySeason[String(season)] ?? [];
  const [event, setEvent] = useState(events[0]?.slug ?? "");

  function handleSeasonChange(nextSeason: number) {
    setSeason(nextSeason);
    setEvent(knownEventsBySeason[String(nextSeason)]?.[0]?.slug ?? "");
  }

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!event) return;
    router.push(`/race/${season}/${event}`);
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
          onChange={(e) => handleSeasonChange(Number(e.target.value))}
          className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none"
        >
          {SEASONS.map((year) => (
            <option key={year} value={year}>
              {year}
              {knownEventsBySeason[String(year)]?.length ? "" : " (none generated yet)"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="riq-event" className="mb-1 block text-xs text-riq-gray">
          Grand Prix
        </label>
        <select
          id="riq-event"
          required
          disabled={events.length === 0}
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none disabled:opacity-50"
        >
          {events.length === 0 ? (
            <option value="">No races generated yet for {season}</option>
          ) : (
            events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.name}
              </option>
            ))
          )}
        </select>
      </div>
      <button
        type="submit"
        disabled={events.length === 0}
        className="rounded-md bg-riq-red px-5 py-2.5 text-sm font-medium text-riq-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Analyze
      </button>
      <p className="text-xs text-riq-gray sm:col-span-3">
        RaceIQ only shows races that have already been generated, so every option above leads to a
        real report. See{" "}
        <a href="/archive" className="underline underline-offset-2 hover:text-riq-white">
          the archive
        </a>{" "}
        for the full list.
      </p>
    </form>
  );
}
