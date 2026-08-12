import { z } from "zod";

export const latitudeSchema = z.coerce
  .number({ message: "Latitude must be a number." })
  .min(-90, "Latitude must be between -90 and 90.")
  .max(90, "Latitude must be between -90 and 90.");

export const longitudeSchema = z.coerce
  .number({ message: "Longitude must be a number." })
  .min(-180, "Longitude must be between -180 and 180.")
  .max(180, "Longitude must be between -180 and 180.");

export const radiusSchema = z.coerce
  .number({ message: "Radius must be a number." })
  .refine((value) => [5, 10, 25, 50].includes(value), {
    message: "Radius must be one of 5, 10, 25, or 50 km.",
  });

export const locationQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radius: radiusSchema,
});

export const nearbyQuerySchema = locationQuerySchema.extend({
  species: z.string().trim().max(120).optional(),
});

export type LocationQuery = z.infer<typeof locationQuerySchema>;
