import { requireUser } from "@/lib/supabase/server";
import { ObservationRepository } from "@/repositories/observation.repository";
import { observationInputSchema } from "@/schemas/observation.schema";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    return Response.json({
      data: await new ObservationRepository(supabase).listForUser(user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const input = observationInputSchema.parse(await request.json());
    return Response.json(
      {
        data: await new ObservationRepository(supabase).create(user.id, input),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
