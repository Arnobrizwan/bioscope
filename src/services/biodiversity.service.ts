import type {
  BiodiversitySummary,
  OccurrenceRecord,
  SpeciesSummary,
  TaxonomicDistribution,
  TaxonomicGroup,
} from "@/types/domain";

const EMPTY_DISTRIBUTION: TaxonomicDistribution = {
  birds: 0,
  mammals: 0,
  reptiles: 0,
  amphibians: 0,
  plants: 0,
  insects: 0,
  other: 0,
};

export function classifyTaxon(
  className?: string,
  kingdom?: string,
): TaxonomicGroup {
  const normalizedClass = className?.trim().toLowerCase();
  const normalizedKingdom = kingdom?.trim().toLowerCase();

  if (normalizedClass === "aves") return "birds";
  if (normalizedClass === "mammalia") return "mammals";
  if (normalizedClass === "reptilia") return "reptiles";
  if (normalizedClass === "amphibia") return "amphibians";
  if (normalizedClass === "insecta") return "insects";
  if (normalizedKingdom === "plantae") return "plants";
  return "other";
}

export function buildBiodiversitySummary(
  records: OccurrenceRecord[],
): BiodiversitySummary {
  const mappable = records.filter(
    (record) =>
      Number.isFinite(record.latitude) &&
      Number.isFinite(record.longitude) &&
      Math.abs(record.latitude) <= 90 &&
      Math.abs(record.longitude) <= 180,
  );
  const distribution = { ...EMPTY_DISTRIBUTION };
  const speciesMap = new Map<string, SpeciesSummary>();

  for (const record of mappable) {
    distribution[record.taxonomicGroup] += 1;
    const identity = record.taxonKey
      ? `taxon:${record.taxonKey}`
      : `name:${record.scientificName.toLowerCase()}`;
    const existing = speciesMap.get(identity);

    if (!existing) {
      speciesMap.set(identity, {
        scientificName: record.scientificName,
        commonName: record.commonName,
        taxonKey: record.taxonKey,
        family: record.family,
        className: record.className,
        taxonomicGroup: record.taxonomicGroup,
        occurrenceCount: 1,
        latestObservation: record.eventDate,
      });
    } else {
      existing.occurrenceCount += 1;
      if (
        record.eventDate &&
        (!existing.latestObservation ||
          record.eventDate > existing.latestObservation)
      ) {
        existing.latestObservation = record.eventDate;
      }
    }
  }

  const species = [...speciesMap.values()].sort(
    (a, b) =>
      b.occurrenceCount - a.occurrenceCount ||
      a.scientificName.localeCompare(b.scientificName),
  );

  return {
    speciesCount: species.length,
    occurrenceCount: mappable.length,
    species,
    occurrences: mappable,
    taxonomicDistribution: distribution,
  };
}

export function emptyBiodiversitySummary(): BiodiversitySummary {
  return {
    speciesCount: 0,
    occurrenceCount: 0,
    species: [],
    occurrences: [],
    taxonomicDistribution: { ...EMPTY_DISTRIBUTION },
  };
}
