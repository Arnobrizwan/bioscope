import { z } from "zod";
import { latitudeSchema, longitudeSchema } from "@/schemas/location.schema";

export const observationInputSchema = z.object({
  speciesName: z.string().trim().min(2).max(160),
  scientificName: z.string().trim().max(160).optional().or(z.literal("")),
  taxonKey: z.coerce.number().int().positive().optional(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  observedAt: z.string().datetime({ offset: true }),
  count: z.coerce.number().int().min(1).max(100_000),
  notes: z.string().trim().max(2_000).optional().or(z.literal("")),
  evidenceUrl: z.string().url().max(2_048).optional().or(z.literal("")),
  isPublic: z.boolean().default(false),
});

export type ObservationInput = z.infer<typeof observationInputSchema>;
