import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import {
  getOccurrencesByTaxon,
  getSpeciesDetails,
} from "@/services/gbif.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ taxonKey: string }> },
) {
  try {
    const { taxonKey } = await context.params;
    const key = z.coerce.number().int().positive().parse(taxonKey);
    const [species, occurrences] = await Promise.all([
      getSpeciesDetails(key),
      getOccurrencesByTaxon(key),
    ]);
    return Response.json({
      data: { species, occurrenceCount: occurrences.count },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
