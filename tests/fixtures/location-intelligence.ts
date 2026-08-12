import type { LocationIntelligence } from "@/types/domain";

export const locationIntelligenceFixture: LocationIntelligence = {
  location: { latitude: 4.21, longitude: 101.98, radiusKm: 25 },
  biodiversity: {
    speciesCount: 2,
    occurrenceCount: 3,
    species: [
      {
        scientificName: "Anthracoceros malayanus",
        commonName: "Black hornbill",
        taxonKey: 2474578,
        className: "Aves",
        family: "Bucerotidae",
        taxonomicGroup: "birds",
        occurrenceCount: 2,
      },
      {
        scientificName: "Dipterocarpus grandiflorus",
        taxonKey: 3694480,
        family: "Dipterocarpaceae",
        taxonomicGroup: "plants",
        occurrenceCount: 1,
      },
    ],
    occurrences: [
      {
        id: "1",
        scientificName: "Anthracoceros malayanus",
        latitude: 4.2,
        longitude: 101.9,
        className: "Aves",
        kingdom: "Animalia",
        taxonomicGroup: "birds",
      },
      {
        id: "2",
        scientificName: "Anthracoceros malayanus",
        latitude: 4.3,
        longitude: 102,
        className: "Aves",
        kingdom: "Animalia",
        taxonomicGroup: "birds",
      },
      {
        id: "3",
        scientificName: "Dipterocarpus grandiflorus",
        latitude: 4.1,
        longitude: 101.8,
        kingdom: "Plantae",
        taxonomicGroup: "plants",
      },
    ],
    taxonomicDistribution: {
      birds: 2,
      mammals: 0,
      reptiles: 0,
      amphibians: 0,
      plants: 1,
      insects: 0,
      other: 0,
    },
  },
  environment: {
    temperature: 28.4,
    precipitation: 6.2,
    humidity: 81,
    solarRadiation: 4.8,
    period: { start: "20260701", end: "20260730" },
    units: {
      temperature: "°C",
      precipitation: "mm/day",
      humidity: "%",
      solarRadiation: "kWh/m²/day",
    },
  },
  metadata: {
    gbifRecordsFetched: 3,
    generatedAt: "2026-08-10T00:00:00.000Z",
    biodiversityStatus: "ok",
    environmentStatus: "ok",
    warnings: [],
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
