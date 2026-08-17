import type { Metadata } from "next";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { ShareButton } from "@/components/ShareButton";
import { TeamSwatch } from "@/components/TeamSwatch";
import { WhatDecidedTheRace } from "@/components/WhatDecidedTheRace";
import { ChartCard } from "@/components/ChartCard";
import { ConsistencyChart } from "@/components/charts/ConsistencyChart";
import { DegradationChart } from "@/components/charts/DegradationChart";
import { LapEvolutionChart } from "@/components/charts/LapEvolutionChart";
import { PaceChart } from "@/components/charts/PaceChart";
import { buildDriverInfo } from "@/lib/driverInfo";
import { DEMO_FIXTURE_ROUTE, listGeneratedAnalyses, resolveAnalysis } from "@/lib/raceData";

const SITE_URL = "https://raceiq.crouchdevelopment.com";

// Cloudflare Workers have no filesystem at request time (see raceData.ts),
// so any params not returned by generateStaticParams below must 404 at
// the routing layer rather than fall through to a dynamic render that
// would crash trying to read data/** -- see not-found.tsx for the page
// users actually see when that happens.
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ year: string; event: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, event } = await params;
  const analysis = resolveAnalysis(year, event);

  if (!analysis) {
    return { title: "Analysis not available", robots: { index: false, follow: false } };
  }

  const isSample = analysis.dataSource === "demo-fixture";
  const title = `${analysis.event.name} ${analysis.event.year} — RaceIQ Analysis`;
  const description = analysis.summary.fastestAveragePaceDriver
    ? `${analysis.summary.fastestAveragePaceDriver} led average race pace. RaceIQ breaks down pace, consistency, and degradation beyond the finishing order.`
    : "RaceIQ pace, consistency, and degradation analysis.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/race/${year}/${event}` },
    robots: isSample ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/race/${year}/${event}`,
      images: [`/race/${year}/${event}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RaceReportPage({ params }: PageProps) {
  const { year, event } = await params;
  const analysis = resolveAnalysis(year, event);

  if (!analysis) {
    return (
      <div className="riq-container py-20">
        <div className="riq-panel mx-auto max-w-xl p-8 text-center">
          <p className="font-display text-2xl text-riq-white">Analysis not yet generated</p>
          <p className="mt-3 text-sm text-riq-gray">
            RaceIQ generates analyses out-of-band from FastF1 and commits the results as data
            artifacts, so only races that have already been generated have a report here. This
            one hasn&apos;t been generated in this environment yet.
          </p>
          <a href="/archive" className="mt-6 inline-block rounded-md bg-riq-red px-5 py-2.5 text-sm font-medium text-riq-white">
            See the Race Library
          </a>
        </div>
      </div>
    );
  }

  if (!analysis.availability.lapTiming) {
    return (
      <div className="riq-container py-20">
        <div className="riq-panel mx-auto max-w-xl p-8 text-center">
          <p className="font-display text-2xl text-riq-white">Limited data for {analysis.event.year}</p>
          <p className="mt-3 text-sm text-riq-gray">
            {analysis.warnings[0] ??
              "RaceIQ's pace, consistency, and degradation views require FastF1 lap timing data, which is not available for this season."}
          </p>
        </div>
      </div>
    );
  }

  const driverInfo = buildDriverInfo(analysis.drivers);
  const isSample = analysis.dataSource === "demo-fixture";
  const canonicalUrl = `${SITE_URL}/race/${year}/${event}`;

  return (
    <div className="riq-container flex flex-col gap-12 py-12">
      <header className="flex flex-col gap-4 border-b riq-divider pb-8">
        {isSample ? <SampleDataBanner /> : null}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-riq-cyan">
              {analysis.event.year} · {analysis.event.session === "R" ? "Race" : analysis.event.session}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-wide text-riq-white sm:text-5xl">
              {analysis.event.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-riq-gray">
              <TeamSwatch driver={driverInfo[analysis.summary.fastestAveragePaceDriver ?? ""]} />
              {analysis.event.circuit ?? "Circuit unverified"}
              {analysis.event.date ? ` · ${analysis.event.date}` : ""}
            </p>
          </div>
          <ShareButton url={canonicalUrl} title={`${analysis.event.name} — RaceIQ`} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AvailabilityBadges availability={analysis.availability} />
          <p className="text-xs text-riq-gray">
            Generated {new Date(analysis.generatedAt).toISOString().slice(0, 10)} · RaceIQ v{analysis.analysisVersion}
          </p>
        </div>
      </header>

      <WhatDecidedTheRace analysis={analysis} drivers={driverInfo} />

      <section aria-labelledby="riq-evidence-charts" className="flex flex-col gap-8">
        <h2 id="riq-evidence-charts" className="font-display text-2xl tracking-wide text-riq-white">
          The Evidence
        </h2>

        <ChartCard
          title="Average Race Pace"
          description="Mean lap time across quick laps, fastest to slowest."
          methodology={analysis.methodology.averagePace}
        >
          <PaceChart pace={analysis.paceRanking} drivers={driverInfo} />
        </ChartCard>

        <ChartCard
          title="Lap Evolution"
          description="Lap-by-lap quick-lap pace for the top drivers by average pace. Toggle drivers in the legend; drag the bottom slider to zoom."
          methodology={analysis.methodology.topDriverSelection}
        >
          <LapEvolutionChart lapTrends={analysis.lapTrends} drivers={driverInfo} />
        </ChartCard>

        <ChartCard
          title="Consistency"
          description="Lap-time standard deviation across quick laps. Lower means a steadier, more repeatable pace."
          methodology={analysis.methodology.consistency}
        >
          <ConsistencyChart consistency={analysis.consistency} drivers={driverInfo} />
        </ChartCard>

        <ChartCard
          title="Degradation"
          description="Opening-versus-closing quick-lap pace for the top drivers by average pace."
          methodology={analysis.methodology.degradation}
        >
          <DegradationChart degradation={analysis.degradation} drivers={driverInfo} />
        </ChartCard>
      </section>

      <CollapsibleSection title="Evidence & Methodology">
        <p className="mb-4 text-sm text-riq-gray">{analysis.methodology.quickLapDefinition}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {analysis.evidence.map((item, index) => (
            <li key={`${item.metric}-${item.driver}-${index}`} className="rounded-md border riq-divider p-4 text-sm">
              <p className="flex items-center gap-1.5 text-riq-white">
                <TeamSwatch driver={driverInfo[item.driver]} />
                {item.metric} · {driverInfo[item.driver]?.fullName ?? item.driver}
              </p>
              <p className="mt-1 tabular-nums text-riq-cyan">
                {item.value.toFixed(3)} {item.unit} · {item.sampleSize} laps
              </p>
              <p className="mt-1 text-xs text-riq-gray">{item.methodology}</p>
            </li>
          ))}
        </ul>
        {analysis.warnings.length > 0 ? (
          <div className="mt-4 border-t riq-divider pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-riq-gray">Warnings</p>
            <ul className="space-y-1 text-sm text-riq-orange">
              {analysis.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleSection>

      <DisclaimerBanner compact />
    </div>
  );
}

export function generateStaticParams() {
  const generated = listGeneratedAnalyses().map(({ year, eventSlug }) => ({ year, event: eventSlug }));
  return [...generated, { year: DEMO_FIXTURE_ROUTE.year, event: DEMO_FIXTURE_ROUTE.eventSlug }];
}
