import type { Metadata } from "next";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";

export const metadata: Metadata = {
  title: "About",
  description:
    "What RaceIQ is, why Crouch Development built it, and how it applies to any business sitting on unused data.",
};

export default function AboutPage() {
  return (
    <div className="riq-container max-w-3xl py-12">
      <h1 className="font-display text-3xl tracking-wide text-riq-white">About RaceIQ</h1>

      <div className="mt-6 space-y-4 text-riq-gray">
        <p>
          RaceIQ turns historical Formula 1 race sessions into evidence-based performance reports.
          Select a race and RaceIQ shows the pace, consistency, and degradation patterns behind
          the finishing order, with every claim traceable back to a metric, a driver, a value, and
          a sample size.
        </p>
        <p>
          RaceIQ is built by Bryan Crouch under{" "}
          <a href="https://crouchdevelopment.com" className="underline underline-offset-2 hover:text-riq-white">
            Crouch Development
          </a>
          , a systems and software practice. It started as{" "}
          <a
            href="https://github.com/bdcrouch79/f1-race-insights"
            className="underline underline-offset-2 hover:text-riq-white"
          >
            F1 Race Insights
          </a>
          , a small motorsport analytics lab, and grew into a public application without
          discarding that lab&apos;s original working analysis.
        </p>

        <h2 className="pt-4 font-display text-xl tracking-wide text-riq-white">Why this exists</h2>
        <p>
          Every business already has numbers sitting around: call logs, response times, inventory
          counts, ad spend, website traffic. Almost none of it gets turned into an actual answer.
          It just sits in a spreadsheet nobody opens.
        </p>
        <p>
          A Formula 1 race is one of the messier data problems you can find: twenty drivers,
          dozens of laps each, thousands of individual lap times, all recorded in real time.
          RaceIQ takes that mess and turns it into something anyone can read in ten seconds, with
          every number traceable back to where it came from.
        </p>
        <p>
          That is not really a motorsport project. It is proof of what happens when someone
          actually builds the system instead of leaving the data alone. Bryan Crouch built RaceIQ
          to show that directly. If your business has numbers sitting around that nobody has
          turned into answers yet, that is the kind of problem{" "}
          <a
            href="https://crouchdevelopment.com/systems"
            className="underline underline-offset-2 hover:text-riq-white"
          >
            Crouch Development
          </a>{" "}
          builds systems to solve.
        </p>

        <h2 className="pt-4 font-display text-xl tracking-wide text-riq-white">How it&apos;s built</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A Python engine (<code>analysis/raceiq/</code>) built on FastF1 and pandas computes the
            metrics and returns a versioned JSON contract.
          </li>
          <li>
            Analyses are generated out-of-band and committed as data artifacts, because FastF1 and
            pandas cannot run inside a standard Cloudflare Worker.
          </li>
          <li>
            The frontend is a Next.js application that reads those generated artifacts and renders
            interactive charts, with no analysis logic reimplemented in TypeScript.
          </li>
        </ul>

        <h2 className="pt-4 font-display text-xl tracking-wide text-riq-white">Repository</h2>
        <p>
          RaceIQ&apos;s source, including the analysis engine, tests, and this application, is
          public at{" "}
          <a
            href="https://github.com/bdcrouch79/f1-race-insights"
            className="underline underline-offset-2 hover:text-riq-white"
          >
            github.com/bdcrouch79/f1-race-insights
          </a>
          .
        </p>

        <h2 className="pt-4 font-display text-xl tracking-wide text-riq-white">Independence</h2>
        <DisclaimerBanner />
      </div>
    </div>
  );
}
