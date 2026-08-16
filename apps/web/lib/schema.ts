import { z } from "zod";

/**
 * The RaceIQ analysis contract. Must stay in sync with
 * analysis/raceiq/schemas.py -- this is the frontend half of the same
 * contract, validated independently so a malformed generated file
 * fails a build or request instead of rendering silently wrong.
 */

export const ANALYSIS_VERSION = "1.0.0";

export const dataSourceSchema = z.enum(["generated", "cached", "demo-fixture"]);

export const availabilitySchema = z.object({
  lapTiming: z.boolean(),
  telemetry: z.boolean(),
  tireCompounds: z.boolean(),
  weather: z.boolean(),
});

export const eventSchema = z.object({
  year: z.number().int(),
  round: z.number().int().nullable(),
  name: z.string(),
  session: z.string(),
  date: z.string().nullable(),
  circuit: z.string().nullable(),
});

export const driverSchema = z.object({
  code: z.string(),
  fullName: z.string(),
  team: z.string().nullable(),
  // Real per-season team color from FastF1's own color mapping, used as
  // an identity swatch -- not a team logo. Optional/nullable because
  // older generated files predate this field and some team names don't
  // resolve to a known color. See analysis/raceiq/engine.py::_team_color.
  teamColor: z.string().nullable().optional(),
});

export const paceRankingRowSchema = z.object({
  driver: z.string(),
  rank: z.number().int(),
  averageLapTimeSeconds: z.number(),
  gapToFastestSeconds: z.number(),
  sampleSize: z.number().int(),
});

export const lapPointSchema = z.object({
  lapNumber: z.number().int(),
  lapTimeSeconds: z.number(),
});

export const lapTrendSeriesSchema = z.object({
  driver: z.string(),
  sampleSize: z.number().int(),
  laps: z.array(lapPointSchema),
});

export const consistencyRowSchema = z.object({
  driver: z.string(),
  rank: z.number().int(),
  stdDevSeconds: z.number(),
  sampleSize: z.number().int(),
});

export const degradationRowSchema = z.object({
  driver: z.string(),
  openingAverageSeconds: z.number(),
  closingAverageSeconds: z.number(),
  deltaSeconds: z.number(),
  sampleSize: z.number().int(),
  totalQuickLaps: z.number().int(),
  heuristic: z.literal(true),
});

export const evidenceItemSchema = z.object({
  metric: z.string(),
  driver: z.string(),
  value: z.number(),
  unit: z.string(),
  sampleSize: z.number().int(),
  methodology: z.string(),
});

export const summarySchema = z.object({
  fastestAveragePaceDriver: z.string().nullable(),
  mostConsistentDriver: z.string().nullable(),
  strongestLateRaceDriver: z.string().nullable(),
  largestPaceDeclineDriver: z.string().nullable(),
});

export const raceAnalysisSchema = z.object({
  analysisVersion: z.string(),
  generatedAt: z.string(),
  dataSource: dataSourceSchema,
  event: eventSchema,
  availability: availabilitySchema,
  summary: summarySchema,
  evidence: z.array(evidenceItemSchema),
  drivers: z.array(driverSchema),
  paceRanking: z.array(paceRankingRowSchema),
  lapTrends: z.array(lapTrendSeriesSchema),
  consistency: z.array(consistencyRowSchema),
  degradation: z.array(degradationRowSchema),
  methodology: z.record(z.string(), z.string()),
  warnings: z.array(z.string()),
});

export type RaceAnalysis = z.infer<typeof raceAnalysisSchema>;
export type PaceRankingRow = z.infer<typeof paceRankingRowSchema>;
export type LapTrendSeries = z.infer<typeof lapTrendSeriesSchema>;
export type ConsistencyRow = z.infer<typeof consistencyRowSchema>;
export type DegradationRow = z.infer<typeof degradationRowSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
