import contentCardsData from "../data/content-cards.json";

/**
 * Which races have a generated insight-card PNG available to download
 * (see scripts/generate_race_content.py, the RaceIQ Social Content
 * Engine). Not every one of the 20 races has content generated yet, so
 * this is checked before rendering the "Download insight graphic"
 * sharing control -- static-imported, same architecture as
 * lib/raceData.ts, no runtime filesystem access. See docs/DECISIONS.md.
 */
const CONTENT_CARD_RACES = new Set(
  (contentCardsData as { year: string; eventSlug: string }[]).map((entry) => `${entry.year}/${entry.eventSlug}`),
);

export function hasContentCard(year: string, eventSlug: string): boolean {
  return CONTENT_CARD_RACES.has(`${year}/${eventSlug}`);
}

export function contentCardUrl(year: string, eventSlug: string): string {
  return `/content-cards/${year}/${eventSlug}/insight-card-pace.png`;
}
