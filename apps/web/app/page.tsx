import Link from "next/link";

import { AvailabilityBadges } from "@/components/AvailabilityBadges";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { SeasonRaceSelector } from "@/components/SeasonRaceSelector";
import { SummaryCards } from "@/components/SummaryCards";
import { WeekendBriefForm } from "@/components/WeekendBriefForm";
import { PaceChart } from "@/components/charts/PaceChart";
import { buildDriverInfo } from "@/lib/driverInfo";
import { DEMO_FIXTURE_ROUTE, listGeneratedAnalyses, loadDemoFixture } from "@/lib/raceData";

const HOW_IT_WORKS = [
  {
    title: "Select a race",
    body: "Pick a season and Grand Prix. RaceIQ works from FastF1 lap-timing data, which reliably covers 2018 onward.",
  },
  {
    title: "RaceIQ reads the laps",
    body: "The engine filters to representative quick laps and computes pace, consistency, and degradation for every driver.",
  },
  {
    title: "You get the evidence",
    body: "Every headline in the summary links back to a metric, a value, and a sample size, not a guess.",
  },
];

export default function HomePage() {
  const demo = loadDemoFixture();
  const generated = listGeneratedAnalyses();

  // Prefer a real analysis for the hero CTA and preview section; only
  // fall back to the synthetic demo fixture when nothing real exists yet.
  const featured = generated[0] ?? null;
  const featuredAnalysis = featured?.analysis ?? demo;
  const featuredRoute = featured
    ? { year: featured.year, eventSlug: featured.eventSlug }
    : DEMO_FIXTURE_ROUTE;
  const isFeaturedSample = !featured;
  const driverInfo = featuredAnalysis ? buildDriverInfo(featuredAnalysis.drivers) : {};

  return (
    <div>
      <section className="riq-container flex flex-col gap-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-riq-cyan">RaceIQ</p>
          <h1 className="font-display text-4xl leading-tight tracking-wide text-riq-white sm:text-6xl">
            The finishing order is only the headline.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-riq-gray">
            RaceIQ reveals the pace, consistency, degradation, and performance patterns that
            shaped the race.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#analyze"
              className="rounded-md bg-riq-red px-6 py-3 text-sm font-medium text-riq-white transition-opacity hover:opacity-90"
            >
              Analyze a Race
            </a>
            {featuredAnalysis ? (
              <Link
                href={`/race/${featuredRoute.year}/${featuredRoute.eventSlug}`}
                className="rounded-md border riq-divider px-6 py-3 text-sm font-medium text-riq-white riq-hover-lift"
              >
                {isFeaturedSample ? "View a Sample Report" : `Explore ${featuredAnalysis.event.name}`}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section id="analyze" className="riq-container pb-16">
        <SeasonRaceSelector />
      </section>

      {featuredAnalysis ? (
        <section className="riq-container flex flex-col gap-4 pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl tracking-wide text-riq-white">
              {isFeaturedSample ? "What a RaceIQ report looks like" : featuredAnalysis.event.name}
            </h2>
            <Link href={`/race/${featuredRoute.year}/${featuredRoute.eventSlug}`} className="text-sm text-riq-cyan hover:underline">
              Full report →
            </Link>
          </div>
          {isFeaturedSample ? <SampleDataBanner /> : null}
          <SummaryCards summary={featuredAnalysis.summary} evidence={featuredAnalysis.evidence} drivers={driverInfo} />
          <div className="riq-panel p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg tracking-wide text-riq-white">Average Race Pace</h3>
            <PaceChart pace={featuredAnalysis.paceRanking} drivers={driverInfo} />
          </div>
        </section>
      ) : null}

      <section className="riq-container grid gap-6 pb-16 sm:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <div key={step.title} className="riq-panel p-6">
            <p className="font-display text-3xl text-riq-cyan">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-3 font-display text-lg tracking-wide text-riq-white">{step.title}</p>
            <p className="mt-2 text-sm text-riq-gray">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="riq-container pb-16">
        <h2 className="mb-4 font-display text-2xl tracking-wide text-riq-white">Real analyses</h2>
        {generated.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generated.map(({ year, eventSlug, analysis }) => (
              <li key={`${year}-${eventSlug}`}>
                <Link href={`/race/${year}/${eventSlug}`} className="riq-panel riq-hover-lift block p-5">
                  <p className="font-display text-lg text-riq-white">{analysis.event.name}</p>
                  <p className="text-sm text-riq-gray">{year}</p>
                  <div className="mt-3">
                    <AvailabilityBadges availability={analysis.availability} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="riq-panel p-5 text-sm text-riq-gray">
            No real races have been generated in this environment yet. RaceIQ analyses are
            generated out-of-band from FastF1 and committed as data artifacts -- see{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-riq-white">
              methodology
            </Link>{" "}
            for how generation works.
          </p>
        )}
      </section>

      <section className="riq-container pb-16">
        <WeekendBriefForm source="homepage" />
      </section>

      <section className="riq-container pb-20">
        <DisclaimerBanner />
        <p className="mt-2 text-sm text-riq-gray">
          RaceIQ is built by Bryan Crouch under{" "}
          <a href="https://crouchdevelopment.com" className="underline underline-offset-2 hover:text-riq-white">
            Crouch Development
          </a>
          .
        </p>
      </section>
    </div>
  );
}
