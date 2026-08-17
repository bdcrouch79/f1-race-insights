"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";
import { TeamSwatch } from "@/components/TeamSwatch";
import { buildDriverInfo } from "@/lib/driverInfo";
import { driverLabel } from "@/lib/format";
import { getPrimaryInsight, type LibraryRaceEntry } from "@/lib/raceInsight";

const ALL = "all";

/**
 * The Legendary Race Library: every real generated race, filterable by
 * season, editorial category, driver, and featured status. Used on both
 * the homepage and /archive so there is exactly one filtering
 * implementation. Only ever receives real, already-generated races --
 * it never displays a season or race that doesn't have committed data
 * (see the callers in app/page.tsx and app/archive/page.tsx).
 */
export function RaceLibrary({ entries }: { entries: LibraryRaceEntry[] }) {
  const [season, setSeason] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [driver, setDriver] = useState(ALL);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [query, setQuery] = useState("");

  const seasons = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.year))).sort((a, b) => Number(b) - Number(a)),
    [entries],
  );

  const categories = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.category).filter((c): c is string => Boolean(c)))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [entries],
  );

  const driverOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const entry of entries) {
      for (const d of entry.analysis.drivers) {
        if (!byCode.has(d.code)) byCode.set(d.code, driverLabel(d));
      }
    }
    return Array.from(byCode.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  const filtered = entries.filter((entry) => {
    if (season !== ALL && entry.year !== season) return false;
    if (category !== ALL && entry.category !== category) return false;
    if (driver !== ALL && !entry.analysis.drivers.some((d) => d.code === driver)) return false;
    if (featuredOnly && !entry.featured) return false;
    if (query.trim().length > 0 && !entry.analysis.event.name.toLowerCase().includes(query.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectClass =
    "w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white focus:border-riq-cyan focus:outline-none";

  return (
    <div className="flex flex-col gap-6">
      <div className="riq-panel flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="riq-lib-season" className="mb-1 block text-xs text-riq-gray">
              Season
            </label>
            <select id="riq-lib-season" value={season} onChange={(e) => setSeason(e.target.value)} className={selectClass}>
              <option value={ALL}>All seasons</option>
              {seasons.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="riq-lib-category" className="mb-1 block text-xs text-riq-gray">
              Category
            </label>
            <select id="riq-lib-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              <option value={ALL}>All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="riq-lib-driver" className="mb-1 block text-xs text-riq-gray">
              Driver
            </label>
            <select id="riq-lib-driver" value={driver} onChange={(e) => setDriver(e.target.value)} className={selectClass}>
              <option value={ALL}>All drivers</option>
              {driverOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setFeaturedOnly((v) => !v)}
              aria-pressed={featuredOnly}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                featuredOnly
                  ? "border-riq-cyan bg-riq-cyan/10 text-riq-cyan"
                  : "riq-divider bg-riq-graphite text-riq-gray hover:text-riq-white"
              }`}
            >
              {featuredOnly ? "★ Featured only" : "☆ Featured only"}
            </button>
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Grand Prix name"
          aria-label="Search by Grand Prix name"
          className="w-full rounded-md border riq-divider bg-riq-graphite px-3 py-2 text-sm text-riq-white placeholder:text-riq-gray/60 focus:border-riq-cyan focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="riq-panel p-6 text-sm text-riq-gray">No races match these filters.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <RaceLibraryCard key={`${entry.year}-${entry.eventSlug}`} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RaceLibraryCard({ entry }: { entry: LibraryRaceEntry }) {
  const drivers = buildDriverInfo(entry.analysis.drivers);
  const insight = getPrimaryInsight(entry.analysis, drivers);
  const leader = drivers[entry.analysis.summary.fastestAveragePaceDriver ?? ""];

  return (
    <li>
      <Link
        href={`/race/${entry.year}/${entry.eventSlug}`}
        className="riq-panel riq-hover-lift flex h-full flex-col gap-3 p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg leading-tight text-riq-white">{entry.analysis.event.name}</p>
            <p className="mt-0.5 text-sm text-riq-gray">
              {entry.year}
              {entry.analysis.event.circuit ? ` · ${entry.analysis.event.circuit}` : ""}
            </p>
          </div>
          {entry.featured ? (
            <span className="shrink-0 rounded-full border border-riq-cyan/40 px-2 py-0.5 text-[10px] uppercase text-riq-cyan">
              Featured
            </span>
          ) : null}
        </div>

        {entry.category ? (
          <span className="w-fit rounded-full border riq-divider px-2 py-0.5 text-[10px] uppercase tracking-wide text-riq-gray">
            {entry.category.replace(/-/g, " ")}
          </span>
        ) : null}

        <p className="flex items-start gap-1.5 text-sm text-riq-white">
          <TeamSwatch driver={leader} />
          {insight}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <AvailabilityBadges availability={entry.analysis.availability} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-riq-cyan">View Report &rarr;</span>
      </Link>
    </li>
  );
}
