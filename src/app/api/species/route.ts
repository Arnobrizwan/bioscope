import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import { searchSpecies } from "@/services/gbif.service";

export async function GET(request: Request) {
  try {
    const query = z
      .string()
      .trim()
      .min(2)
      .max(120)
      .parse(new URL(request.url).searchParams.get("q"));
    return Response.json({ data: await searchSpecies(query) });
  } catch (error) {
    return errorResponse(error);
  }
}
