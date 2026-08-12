import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import {
  getGeoreferencedOccurrenceCountByTaxon,
  getSpeciesDetails,
} from "@/services/gbif.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ taxonKey: string }> },
) {
  try {
    const { taxonKey } = await context.params;
    const key = z.coerce.number().int().positive().parse(taxonKey);
    const [species, georeferencedOccurrenceCount] = await Promise.all([
      getSpeciesDetails(key),
      getGeoreferencedOccurrenceCountByTaxon(key),
    ]);
    return Response.json({
      data: { species, georeferencedOccurrenceCount },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
