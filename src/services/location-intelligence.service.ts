import {
  buildBiodiversitySummary,
  emptyBiodiversitySummary,
} from "@/services/biodiversity.service";
import { searchOccurrences } from "@/services/gbif.service";
import { getEnvironmentalSnapshot } from "@/services/nasa-power.service";
import type { LocationIntelligence } from "@/types/domain";
import type { LocationQuery } from "@/schemas/location.schema";

export async function getLocationIntelligence(
  query: LocationQuery,
): Promise<LocationIntelligence> {
  const location = {
    latitude: query.lat,
    longitude: query.lng,
    radiusKm: query.radius,
  };
  const [gbifResult, nasaResult] = await Promise.allSettled([
    searchOccurrences(location),
    getEnvironmentalSnapshot(location),
  ]);
  const warnings: string[] = [];
  const biodiversity =
    gbifResult.status === "fulfilled"
      ? buildBiodiversitySummary(gbifResult.value.records)
      : emptyBiodiversitySummary();

  if (gbifResult.status === "rejected") {
    warnings.push("GBIF occurrence data is temporarily unavailable.");
  } else if (!biodiversity.occurrenceCount) {
    warnings.push(
      "No georeferenced GBIF occurrence records were returned for this area and radius. This does not indicate that biodiversity is absent.",
    );
  }
  if (nasaResult.status === "rejected") {
    warnings.push(
      "NASA POWER environmental context is temporarily unavailable.",
    );
  }

  return {
    location,
    biodiversity,
    environment: nasaResult.status === "fulfilled" ? nasaResult.value : null,
    metadata: {
      gbifRecordsFetched:
        gbifResult.status === "fulfilled" ? gbifResult.value.records.length : 0,
      generatedAt: new Date().toISOString(),
      biodiversityStatus:
        gbifResult.status === "rejected"
          ? "unavailable"
          : biodiversity.occurrenceCount
            ? "ok"
            : "empty",
      environmentStatus:
        nasaResult.status === "fulfilled" ? "ok" : "unavailable",
      warnings,
      sources: [
        { provider: "GBIF", url: "https://www.gbif.org/", isDemo: false },
        {
          provider: "NASA POWER",
          url: "https://power.larc.nasa.gov/",
          isDemo: false,
        },
      ],
    },
  };
}
