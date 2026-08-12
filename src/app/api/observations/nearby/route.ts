import { requireUser } from "@/lib/supabase/server";
import { ObservationRepository } from "@/repositories/observation.repository";
import { nearbyQuerySchema } from "@/schemas/location.schema";
import { errorResponse } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const params = new URL(request.url).searchParams;
    const query = nearbyQuerySchema.parse({
      lat: params.get("lat"),
      lng: params.get("lng"),
      radius: params.get("radius"),
      species: params.get("species") || undefined,
    });
    return Response.json({
      data: await new ObservationRepository(supabase).nearby(user.id, query),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
