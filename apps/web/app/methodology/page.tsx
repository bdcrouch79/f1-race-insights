import type { Metadata } from "next";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { LAP_TIMING_MIN_SEASON, SCHEDULE_MIN_SEASON } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How RaceIQ loads race data, defines a quick lap, and calculates pace, consistency, and degradation.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b riq-divider py-8 first:pt-0 last:border-b-0">
      <h2 className="font-display text-2xl tracking-wide text-riq-white">{title}</h2>
      <div className="prose-riq mt-3 space-y-3 text-riq-gray">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="riq-container max-w-3xl py-12">
      <h1 className="font-display text-3xl tracking-wide text-riq-white">Methodology</h1>
      <p className="mt-3 text-riq-gray">
        RaceIQ is a historical race analysis engine, not a race simulator or strategy engine. It
        does not predict alternative outcomes. Every view here is calculated directly from
        recorded lap timing data for a race that already happened.
      </p>

      <Section id="data-source" title="Data source">
        <p>
          RaceIQ&apos;s analysis engine (<code>analysis/raceiq/</code>) is built on{" "}
          <a href="https://github.com/theOehrly/Fast-F1" className="underline underline-offset-2">
            FastF1
          </a>
          , a Python package that provides Formula 1 timing, telemetry, and schedule data. RaceIQ
          is independent and unaffiliated with FastF1, Formula 1, the FIA, any team, or any
          driver.
        </p>
      </Section>

      <Section id="session-loading" title="How a session is loaded">
        <p>
          The engine calls <code>fastf1.get_session(year, event, &quot;R&quot;)</code> and{" "}
          <code>session.load()</code> to retrieve lap timing for the race session. Phase 1 only
          supports the Race session; qualifying and sprint sessions are schema-compatible but not
          yet wired into the engine.
        </p>
      </Section>

      <Section id="caching" title="Caching">
        <p>
          FastF1&apos;s local cache stores downloaded session data so repeated runs reuse it
          instead of re-fetching. RaceIQ additionally caches the finished analysis itself: once a
          race is generated, the resulting JSON file is the cache. Regeneration only happens when
          the analysis engine version changes or the file is deliberately regenerated.
        </p>
      </Section>

      <Section id="quick-laps" title="What a quick lap is">
        <p>
          A <strong>quick lap</strong> is any lap under 107% of the fastest single lap time
          recorded by any driver in the session (FastF1&apos;s default{" "}
          <code>pick_quicklaps()</code> threshold). This filters out in/out laps and most laps
          disrupted by pit stops, but it does not explicitly detect or label safety car or virtual
          safety car periods. All four RaceIQ views are calculated from quick laps only.
        </p>
      </Section>

      <Section id="formulas" title="Metric formulas">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Average pace</strong>: mean lap time across a driver&apos;s quick laps, ranked
            fastest to slowest.
          </li>
          <li>
            <strong>Lap evolution</strong>: each quick lap&apos;s time by lap number, shown for the
            top 5 drivers by average pace.
          </li>
          <li>
            <strong>Consistency</strong>: standard deviation of lap time across a driver&apos;s
            quick laps. Lower means a steadier, more repeatable pace.
          </li>
        </ul>
      </Section>

      <Section id="degradation" title="The degradation heuristic">
        <p>
          Degradation compares the mean of a driver&apos;s first 5 quick laps to the mean of their
          last 5 quick laps (fewer if a driver has under 10 quick laps). A positive delta means
          the driver was slower at the end of their sampled quick laps than at the start.
        </p>
        <p>
          <strong>This is a heuristic, not a stint-aware tire model.</strong> It does not know
          about tire compounds, stint boundaries, fuel load, pit strategy, traffic, or safety-car
          periods. Do not read it as a tire-degradation rate.
        </p>
      </Section>

      <Section id="exclusions" title="What RaceIQ does not do">
        <ul className="list-disc space-y-2 pl-5">
          <li>It does not simulate alternative race outcomes or predict results.</li>
          <li>It does not explicitly segment safety cars, virtual safety cars, or traffic.</li>
          <li>It does not model tire compounds, stint boundaries, or pit strategy.</li>
          <li>It does not use an AI or language model to write its summary; every summary line is a deterministic template filled from computed metrics.</li>
        </ul>
      </Section>

      <Section id="historical-limitations" title="Historical coverage">
        <p>
          FastF1 documents reliable lap timing, telemetry, and car data from the {LAP_TIMING_MIN_SEASON} season
          onward. Seasons from {SCHEDULE_MIN_SEASON} to {LAP_TIMING_MIN_SEASON - 1} have schedule and
          classification data only, with no lap-by-lap timing -- so none of RaceIQ&apos;s four
          analysis views can be produced for those seasons. See{" "}
          <a href="/about#coverage" className="underline underline-offset-2">
            the full coverage matrix in docs/DATA_AVAILABILITY.md
          </a>{" "}
          in the repository.
        </p>
      </Section>

      <Section id="versioning" title="Analysis versioning">
        <p>
          Every generated file records an <code>analysisVersion</code>. Cache keys and file paths
          are namespaced by that version, so a change to how a metric is calculated produces a new
          version and new files rather than silently reinterpreting old ones.
        </p>
      </Section>

      <Section id="independence" title="Independence">
        <DisclaimerBanner />
      </Section>
    </div>
  );
}
