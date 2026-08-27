import { RacingLineBackdrop } from "@/components/RacingLineBackdrop";

export function Hero({ raceCount, seasonRange }: { raceCount: number; seasonRange: string }) {
  return (
    <section className="relative overflow-hidden border-b riq-divider">
      <RacingLineBackdrop />
      <div className="riq-container relative flex flex-col gap-8 py-20 sm:py-28">
        <p className="riq-fade-up text-xs uppercase tracking-[0.3em] text-riq-cyan sm:text-sm">
          Motorsport Intelligence
        </p>
        <div className="riq-fade-up max-w-2xl rounded-md border border-riq-red/60 bg-riq-red/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-riq-red sm:text-sm">
            Experimental Data Lab
          </p>
          <p className="mt-2 text-sm leading-6 text-riq-gray sm:text-base">
            RaceIQ is an ongoing Crouch Development experiment, not a finished commercial
            product. Explore it as a working demonstration of how raw data can become clear,
            interactive evidence.
          </p>
        </div>
        <h1 className="riq-fade-up max-w-4xl font-display text-4xl leading-[1.08] tracking-wide text-riq-gray sm:text-6xl lg:text-7xl">
          The finishing order tells you who won.
          <br />
          <span className="text-riq-white">RaceIQ shows you how the race was won.</span>
        </h1>
        <p className="riq-fade-up max-w-xl text-base text-riq-gray sm:text-lg">
          Every report is built from real FastF1 lap timing data. Pace, consistency, and
          degradation, each one traceable back to the lap that proves it.
        </p>
        <div className="riq-fade-up flex flex-wrap items-center gap-4">
          <a
            href="#library"
            className="rounded-md bg-riq-red px-7 py-3.5 text-sm font-medium text-riq-white transition-opacity hover:opacity-90 sm:text-base"
          >
            Explore Race Intelligence
          </a>
          <a
            href="/methodology"
            className="text-sm text-riq-gray underline underline-offset-4 decoration-riq-gray/40 hover:text-riq-white sm:text-base"
          >
            See how it&apos;s calculated
          </a>
        </div>
        <p className="riq-fade-up text-xs uppercase tracking-[0.2em] text-riq-gray/70 sm:text-sm">
          {raceCount} Grand Prix analyzed &middot; {seasonRange} &middot; Real FastF1 lap timing data
        </p>
      </div>
    </section>
  );
}
