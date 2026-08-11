import { locationQuerySchema } from "@/schemas/location.schema";
import { getLocationIntelligence } from "@/services/location-intelligence.service";
import { AppError, errorResponse } from "@/lib/errors";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const limit = checkRateLimit(
      `location:${requestIdentity(request)}`,
      30,
      60_000,
    );
    if (!limit.allowed)
      throw new AppError("RATE_LIMITED", "Too many analysis requests.", 429);
    const searchParams = new URL(request.url).searchParams;
    const query = locationQuerySchema.parse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
    });
    const intelligence = await getLocationIntelligence(query);
    return Response.json(
      { data: intelligence },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
