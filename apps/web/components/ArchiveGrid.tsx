"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";
import type { RaceAnalysis } from "@/lib/schema";

export interface ArchiveEntry {
  year: string;
  eventSlug: string;
  analysis: RaceAnalysis;
  isSample: boolean;
  /** Editorial metadata from data/race-manifest.json, when this race has a matching entry. */
  category?: string;
  featured?: boolean;
  description?: string;
}

export function ArchiveGrid({ entries }: { entries: ArchiveEntry[] }) {
  const [season, setSeason] = useState<string>("all");
  const [query, setQuery] = useState("");

  const seasons = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.year))).sort((a, b) => Number(b) - Number(a)),
    [entries],
  );

  const filtered = entries.filter((entry) => {
    const matchesSeason = season === "all" || entry.year === season;
    const matchesQuery =
      query.trim().length === 0 || entry.analysis.event.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSeason && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="riq-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          aria-label="Filter by season"
          className="rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white"
        >
          <option value="all">All seasons</option>
          {seasons.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Grand Prix name"
          aria-label="Search by Grand Prix name"
          className="flex-1 rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white placeholder:text-riq-gray/60"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="riq-panel p-6 text-sm text-riq-gray">No analyses match this filter.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <li key={`${entry.year}-${entry.eventSlug}`}>
              <Link href={`/race/${entry.year}/${entry.eventSlug}`} className="riq-panel riq-hover-lift block h-full p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-lg text-riq-white">{entry.analysis.event.name}</p>
                  <div className="flex shrink-0 gap-1.5">
                    {entry.featured ? (
                      <span className="rounded-full border border-riq-cyan/40 px-2 py-0.5 text-[10px] uppercase text-riq-cyan">
                        Featured
                      </span>
                    ) : null}
                    {entry.isSample ? (
                      <span className="rounded-full border border-riq-orange/40 px-2 py-0.5 text-[10px] uppercase text-riq-orange">
                        Sample
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-riq-gray">
                  {entry.year}
                  {entry.category ? ` · ${entry.category.replace(/-/g, " ")}` : ""}
                </p>
                {entry.description ? <p className="mt-2 text-sm text-riq-gray">{entry.description}</p> : null}
                <div className="mt-3">
                  <AvailabilityBadges availability={entry.analysis.availability} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
