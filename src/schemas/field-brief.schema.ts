import { z } from "zod";

const groupSchema = z.enum([
  "birds",
  "mammals",
  "reptiles",
  "amphibians",
  "plants",
  "insects",
  "other",
]);
const speciesSummarySchema = z.object({
  scientificName: z.string().trim().min(1).max(240),
  commonName: z.string().trim().max(240).optional(),
  taxonKey: z.number().int().positive().optional(),
  family: z.string().trim().max(160).optional(),
  className: z.string().trim().max(160).optional(),
  taxonomicGroup: groupSchema,
  occurrenceCount: z.number().int().nonnegative(),
  latestObservation: z.string().optional(),
});

export const fieldBriefInputSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusKm: z.number().refine((value) => [5, 10, 25, 50].includes(value)),
  }),
  biodiversitySummary: z.object({
    speciesCount: z.number().int().nonnegative(),
    occurrenceCount: z.number().int().nonnegative(),
  }),
  topSpecies: z.array(speciesSummarySchema).max(8),
  taxonomicDistribution: z.object({
    birds: z.number().nonnegative(),
    mammals: z.number().nonnegative(),
    reptiles: z.number().nonnegative(),
    amphibians: z.number().nonnegative(),
    plants: z.number().nonnegative(),
    insects: z.number().nonnegative(),
    other: z.number().nonnegative(),
  }),
  environmentalSnapshot: z
    .object({
      temperature: z.number().optional(),
      precipitation: z.number().optional(),
      humidity: z.number().optional(),
      solarRadiation: z.number().optional(),
      period: z.object({ start: z.string(), end: z.string() }),
      units: z.object({
        temperature: z.literal("°C"),
        precipitation: z.literal("mm/day"),
        humidity: z.literal("%"),
        solarRadiation: z.literal("kWh/m²/day"),
      }),
    })
    .nullable(),
});

export const fieldBriefSectionsSchema = z.object({
  biodiversitySummary: z.string().min(1).max(2_000),
  notableRecords: z.string().min(1).max(2_000),
  environmentalContext: z.string().min(1).max(2_000),
  surveyPriorities: z.string().min(1).max(2_000),
  dataLimitations: z.string().min(1).max(2_000),
});
