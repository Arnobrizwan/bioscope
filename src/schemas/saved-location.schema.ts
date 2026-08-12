import { z } from "zod";
import {
  latitudeSchema,
  longitudeSchema,
  radiusSchema,
} from "@/schemas/location.schema";

export const savedLocationInputSchema = z.object({
  label: z.string().trim().min(2).max(120),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  radiusKm: radiusSchema,
});

export type SavedLocationInput = z.infer<typeof savedLocationInputSchema>;
