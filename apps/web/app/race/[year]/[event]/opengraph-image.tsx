import fs from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import { buildDriverInfo } from "@/lib/driverInfo";
import { filterEligibleForHeadline } from "@/lib/headlineEligibility";
import { DEMO_FIXTURE_ROUTE, listGeneratedAnalyses, resolveAnalysis } from "@/lib/raceData";

// This route is fully statically generated (see generateStaticParams
// below), so this file read only ever happens at build time, when the
// full monorepo checkout -- including /assets -- is present. No special
// deployment bundling needed for it, unlike data/** (see next.config.ts).
const CD_MARK_DATA_URI = (() => {
  const markPath = path.resolve(process.cwd(), "..", "..", "assets", "cd-mark.png");
  const bytes = fs.readFileSync(markPath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
})();

export const runtime = "nodejs";
export const alt = "RaceIQ race analysis card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Without this, Next only knows to prerender the page itself for known
 * races (via the page's own generateStaticParams) -- this route still
 * defaults to generating the image on demand, at request time, which
 * needs the same node:fs access to data/** as the page. That's fine on
 * Vercel/Node but Cloudflare Workers have no real filesystem at
 * runtime, so an on-demand image for a real race would fail there.
 * Mirroring generateStaticParams here bakes the image as a static file
 * at build time instead, removing the runtime fs dependency entirely
 * for every route this app actually ships.
 */
export function generateStaticParams() {
  const generated = listGeneratedAnalyses().map(({ year, eventSlug }) => ({ year, event: eventSlug }));
  return [...generated, { year: DEMO_FIXTURE_ROUTE.year, event: DEMO_FIXTURE_ROUTE.eventSlug }];
}

const COLORS = {
  black: "#08090B",
  panel: "#1A1E24",
  red: "#FF2B2B",
  orange: "#FF6B00",
  cyan: "#30D5FF",
  white: "#F4F6F8",
  gray: "#8C949F",
};

export default async function OpengraphImage({ params }: { params: Promise<{ year: string; event: string }> }) {
  const { year, event } = await params;
  const analysis = resolveAnalysis(year, event);

  if (!analysis) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: COLORS.black, color: COLORS.white, alignItems: "center", justifyContent: "center", fontSize: 48 }}>
          RaceIQ
        </div>
      ),
      { ...size },
    );
  }

  const drivers = buildDriverInfo(analysis.drivers);

  // The raw paceRanking's own gapToFastestSeconds is relative to the
  // single fastest driver overall, who may not be headline-eligible
  // (see docs/DECISIONS.md, 2026-08-16: Sargeant's 14-lap Monaco 2024
  // sample). Filter to eligible drivers the same way the headline was
  // picked, then recompute gaps relative to the eligible leader --
  // otherwise the bar chart can show an excluded driver's bar as the
  // longest/fastest directly under a headline naming someone else, or
  // show the real leader with a nonzero gap as if they weren't first.
  const eligiblePace = filterEligibleForHeadline(analysis.paceRanking, "sampleSize");
  const top5 = eligiblePace.slice(0, 5);
  const eligibleFastestSeconds = top5[0]?.averageLapTimeSeconds ?? 0;
  const top5WithDisplayGap = top5.map((row) => ({
    ...row,
    displayGapSeconds: row.averageLapTimeSeconds - eligibleFastestSeconds,
  }));
  const maxGap = Math.max(1, ...top5WithDisplayGap.map((row) => row.displayGapSeconds));
  const headlineDriver = analysis.summary.fastestAveragePaceDriver;
  const headlineEvidence = analysis.evidence.find(
    (item) => item.metric === "averagePace" && item.driver === headlineDriver,
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: COLORS.black,
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: COLORS.white, fontWeight: 700 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, background: COLORS.red, marginRight: 11 }} />
            RACE<span style={{ color: COLORS.cyan }}>IQ</span>
          </div>
          <div style={{ fontSize: 20, color: COLORS.gray }}>raceiq.crouchdevelopment.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
          <div style={{ display: "flex", fontSize: 24, color: COLORS.cyan }}>
            {analysis.event.year} · What the finishing order didn&apos;t show
          </div>
          <div style={{ fontSize: 48, color: COLORS.white, fontWeight: 700, marginTop: 6 }}>
            {analysis.event.name}
          </div>
          {headlineDriver ? (
            <div style={{ display: "flex", fontSize: 27, color: COLORS.white, marginTop: 14 }}>
              {drivers[headlineDriver]?.fullName ?? headlineDriver} led average race pace
              {headlineEvidence ? ` at ${headlineEvidence.value.toFixed(3)}s/lap` : ""}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 22, gap: 8 }}>
          {top5WithDisplayGap.map((row, index) => (
            <div key={row.driver} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 66, fontSize: 20, color: COLORS.white }}>{drivers[row.driver]?.code ?? row.driver}</div>
              <div style={{ display: "flex", flex: 1, height: 14, background: COLORS.panel, borderRadius: 7, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max(4, (1 - row.displayGapSeconds / (maxGap || 1)) * 100)}%`,
                    height: "100%",
                    // Real per-season team color when known, falling back to
                    // the leader/field accent split -- never a team logo.
                    background: drivers[row.driver]?.teamColor ?? (index === 0 ? COLORS.cyan : COLORS.orange),
                  }}
                />
              </div>
              <div style={{ display: "flex", width: 84, justifyContent: "flex-end", fontSize: 18, color: COLORS.gray }}>
                {index === 0 ? "Fastest" : `+${row.displayGapSeconds.toFixed(2)}s`}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.panel}`, gap: 12 }}>
          <img src={CD_MARK_DATA_URI} width={22} height={24} alt="" />
          <div style={{ display: "flex", fontSize: 15, color: COLORS.gray }}>
            Built by Crouch Development · Independent motorsport analytics, not affiliated with Formula 1, the FIA, any team, or any driver.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
