import type { FieldBriefInput, LocationIntelligence } from "@/types/domain";

export function buildFieldBriefInput(intelligence: LocationIntelligence): FieldBriefInput {
  return {
    location: intelligence.location,
    biodiversitySummary: {
      speciesCount: intelligence.biodiversity.speciesCount,
      occurrenceCount: intelligence.biodiversity.occurrenceCount,
    },
    topSpecies: intelligence.biodiversity.species.slice(0, 8),
    taxonomicDistribution: intelligence.biodiversity.taxonomicDistribution,
    environmentalSnapshot: intelligence.environment,
  };
}
