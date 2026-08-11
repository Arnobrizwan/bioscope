import { errorResponse } from "@/lib/errors";
import { requireUser } from "@/lib/supabase/server";
import { SavedLocationRepository } from "@/repositories/saved-location.repository";
import { savedLocationInputSchema } from "@/schemas/saved-location.schema";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const locations = await new SavedLocationRepository(supabase).listForUser(user.id);
    return Response.json({ data: locations });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const input = savedLocationInputSchema.parse(await request.json());
    const location = await new SavedLocationRepository(supabase).create(user.id, input);
    return Response.json({ data: location }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
