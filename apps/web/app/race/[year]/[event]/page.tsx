import type { Metadata } from "next";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { ShareButton } from "@/components/ShareButton";
import { SummaryCards } from "@/components/SummaryCards";
import { TeamSwatch } from "@/components/TeamSwatch";
import { WeekendBriefForm } from "@/components/WeekendBriefForm";
import { ChartCard } from "@/components/ChartCard";
import { ConsistencyChart } from "@/components/charts/ConsistencyChart";
import { DegradationChart } from "@/components/charts/DegradationChart";
import { LapEvolutionChart } from "@/components/charts/LapEvolutionChart";
import { PaceChart } from "@/components/charts/PaceChart";
import { buildDriverInfo } from "@/lib/driverInfo";
import { DEMO_FIXTURE_ROUTE, listGeneratedAnalyses, resolveAnalysis } from "@/lib/raceData";

const SITE_URL = "https://raceiq.crouchdevelopment.com";

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
            See what&apos;s available
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
    <div className="riq-container flex flex-col gap-10 py-12">
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
            <p className="mt-2 text-riq-gray">
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

      <section aria-labelledby="riq-summary">
        <h2 id="riq-summary" className="mb-4 font-display text-2xl tracking-wide text-riq-white">
          RaceIQ Summary
        </h2>
        <SummaryCards summary={analysis.summary} evidence={analysis.evidence} drivers={driverInfo} />
      </section>

      <section aria-labelledby="riq-pace">
        <h2 id="riq-pace" className="sr-only">
          Average Race Pace
        </h2>
        <ChartCard
          title="Average Race Pace"
          description="Mean lap time across quick laps, fastest to slowest."
          methodology={analysis.methodology.averagePace}
        >
          <PaceChart pace={analysis.paceRanking} drivers={driverInfo} />
        </ChartCard>
      </section>

      <section aria-labelledby="riq-trends">
        <h2 id="riq-trends" className="sr-only">
          Lap Evolution
        </h2>
        <ChartCard
          title="Lap Evolution"
          description="Lap-by-lap quick-lap pace for the top drivers by average pace. Toggle drivers in the legend; drag the bottom slider to zoom."
          methodology={analysis.methodology.topDriverSelection}
        >
          <LapEvolutionChart lapTrends={analysis.lapTrends} drivers={driverInfo} />
        </ChartCard>
      </section>

      <section aria-labelledby="riq-consistency">
        <h2 id="riq-consistency" className="sr-only">
          Consistency
        </h2>
        <ChartCard
          title="Consistency"
          description="Lap-time standard deviation across quick laps. Lower means a steadier, more repeatable pace."
          methodology={analysis.methodology.consistency}
        >
          <ConsistencyChart consistency={analysis.consistency} drivers={driverInfo} />
        </ChartCard>
      </section>

      <section aria-labelledby="riq-degradation">
        <h2 id="riq-degradation" className="sr-only">
          Degradation
        </h2>
        <ChartCard
          title="Degradation"
          description="Opening-versus-closing quick-lap pace for the top drivers by average pace."
          methodology={analysis.methodology.degradation}
        >
          <DegradationChart degradation={analysis.degradation} drivers={driverInfo} />
        </ChartCard>
      </section>

      <section aria-labelledby="riq-evidence" className="riq-panel p-6">
        <h2 id="riq-evidence" className="mb-4 font-display text-2xl tracking-wide text-riq-white">
          Evidence and Methodology
        </h2>
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
      </section>

      <section aria-labelledby="riq-brief">
        <h2 id="riq-brief" className="sr-only">
          RaceIQ Weekend Brief
        </h2>
        <WeekendBriefForm source="race-report" />
      </section>

      <DisclaimerBanner compact />
    </div>
  );
}

export function generateStaticParams() {
  const generated = listGeneratedAnalyses().map(({ year, eventSlug }) => ({ year, event: eventSlug }));
  return [...generated, { year: DEMO_FIXTURE_ROUTE.year, event: DEMO_FIXTURE_ROUTE.eventSlug }];
}
