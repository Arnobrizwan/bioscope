import { describe, expect, it } from "vitest";
import { buildBiodiversitySummary, classifyTaxon } from "@/services/biodiversity.service";
import type { OccurrenceRecord } from "@/types/domain";

describe("biodiversity normalization", () => {
  it.each([["Aves", "Animalia", "birds"], ["Mammalia", "Animalia", "mammals"], ["Reptilia", "Animalia", "reptiles"], ["Amphibia", "Animalia", "amphibians"], ["Insecta", "Animalia", "insects"], [undefined, "Plantae", "plants"]])("classifies %s as %s", (className, kingdom, expected) => { expect(classifyTaxon(className, kingdom)).toBe(expected); });
  it("deduplicates species and ignores invalid map coordinates", () => {
    const base: OccurrenceRecord = { id: "1", scientificName: "Species alpha", taxonKey: 7, latitude: 4, longitude: 102, taxonomicGroup: "birds" };
    const result = buildBiodiversitySummary([base, { ...base, id: "2" }, { ...base, id: "3", taxonKey: 8, latitude: 200 }]);
    expect(result.speciesCount).toBe(1); expect(result.occurrenceCount).toBe(2); expect(result.species[0]?.occurrenceCount).toBe(2); expect(result.taxonomicDistribution.birds).toBe(2);
  });
});
