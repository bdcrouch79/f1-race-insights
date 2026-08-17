import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { FeaturedRaceSpotlight } from "@/components/FeaturedRaceSpotlight";
import { Hero } from "@/components/Hero";
import { RaceLibrary } from "@/components/RaceLibrary";
import { buildLibraryEntries } from "@/lib/raceLibraryData";
import { pickFeaturedRace } from "@/lib/raceInsight";

export default function HomePage() {
  const entries = buildLibraryEntries();
  const featured = pickFeaturedRace(entries);

  const years = entries.map((entry) => Number(entry.year));
  const seasonRange =
    years.length > 0 ? (Math.min(...years) === Math.max(...years) ? `${Math.min(...years)}` : `${Math.min(...years)}-${Math.max(...years)}`) : "";

  return (
    <div>
      <Hero raceCount={entries.length} seasonRange={seasonRange} />

      {featured ? (
        <section className="riq-container py-16">
          <FeaturedRaceSpotlight entry={featured} />
        </section>
      ) : null}

      <section id="library" className="riq-container flex flex-col gap-6 py-16 scroll-mt-16">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-riq-white">Legendary Race Library</h2>
          <p className="mt-2 max-w-2xl text-riq-gray">
            {entries.length} races, each broken down into pace, consistency, and degradation
            evidence. Filter by season, category, driver, or featured status to find one.
          </p>
        </div>
        <RaceLibrary entries={entries} />
      </section>

      <section className="riq-container pb-16">
        <div className="riq-panel flex flex-col gap-4 border-riq-cyan/30 p-6 sm:p-8">
          <p className="text-lg text-riq-white sm:text-xl">
            RaceIQ transforms thousands of raw timing records into clear answers. Crouch
            Development builds systems that do the same for businesses.
          </p>
          <div>
            <a
              href="https://crouchdevelopment.com/systems"
              className="inline-block rounded-md bg-riq-cyan px-6 py-3 text-sm font-medium text-riq-black transition-opacity hover:opacity-90"
            >
              Turn Your Business Data Into Answers
            </a>
          </div>
        </div>
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
