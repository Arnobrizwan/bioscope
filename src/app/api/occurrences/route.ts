import { AppError, errorResponse } from "@/lib/errors";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";
import { locationQuerySchema } from "@/schemas/location.schema";
import { searchOccurrences } from "@/services/gbif.service";

export async function GET(request: Request) {
  try {
    const limit = checkRateLimit(
      `occurrences:${requestIdentity(request)}`,
      30,
      60_000,
    );
    if (!limit.allowed) {
      throw new AppError("RATE_LIMITED", "Too many occurrence requests.", 429);
    }

    const searchParams = new URL(request.url).searchParams;
    const query = locationQuerySchema.parse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
    });
    const result = await searchOccurrences({
      latitude: query.lat,
      longitude: query.lng,
      radiusKm: query.radius,
    });

    return Response.json(
      {
        data: {
          occurrences: result.records,
          providerCount: result.providerCount,
          source: {
            provider: "GBIF",
            url: "https://www.gbif.org/",
          },
        },
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
