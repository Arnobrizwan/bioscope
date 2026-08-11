export type TaxonomicGroup =
  | "birds"
  | "mammals"
  | "reptiles"
  | "amphibians"
  | "plants"
  | "insects"
  | "other";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface OccurrenceRecord extends LocationCoordinates {
  id: string;
  scientificName: string;
  commonName?: string;
  species?: string;
  genus?: string;
  family?: string;
  className?: string;
  order?: string;
  kingdom?: string;
  taxonKey?: number;
  eventDate?: string;
  basisOfRecord?: string;
  mediaUrl?: string;
  taxonomicGroup: TaxonomicGroup;
}

export interface SpeciesSummary {
  scientificName: string;
  commonName?: string;
  taxonKey?: number;
  family?: string;
  className?: string;
  taxonomicGroup: TaxonomicGroup;
  occurrenceCount: number;
  latestObservation?: string;
}

export type TaxonomicDistribution = Record<TaxonomicGroup, number>;

export interface BiodiversitySummary {
  speciesCount: number;
  occurrenceCount: number;
  species: SpeciesSummary[];
  occurrences: OccurrenceRecord[];
  taxonomicDistribution: TaxonomicDistribution;
}

export interface EnvironmentalSnapshot {
  temperature?: number;
  precipitation?: number;
  humidity?: number;
  solarRadiation?: number;
  period: { start: string; end: string };
  units: {
    temperature: "°C";
    precipitation: "mm/day";
    humidity: "%";
    solarRadiation: "kWh/m²/day";
  };
}

export type ProviderStatus = "ok" | "unavailable" | "empty" | "demo";

export interface LocationIntelligence {
  location: LocationCoordinates & { radiusKm: number };
  biodiversity: BiodiversitySummary;
  environment: EnvironmentalSnapshot | null;
  metadata: {
    gbifRecordsFetched: number;
    generatedAt: string;
    biodiversityStatus: ProviderStatus;
    environmentStatus: ProviderStatus;
    warnings: string[];
    sources: Array<{ provider: string; url: string; isDemo: boolean }>;
  };
}

export interface FieldObservation extends LocationCoordinates {
  id: string;
  userId: string;
  speciesName: string;
  scientificName?: string;
  taxonKey?: number;
  observedAt: string;
  count: number;
  notes?: string;
  evidenceUrl?: string;
  isPublic: boolean;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation extends LocationCoordinates {
  id: string;
  userId: string;
  label: string;
  radiusKm: number;
  createdAt: string;
}

export interface FieldBriefInput {
  location: LocationCoordinates & { radiusKm: number };
  biodiversitySummary: Pick<BiodiversitySummary, "speciesCount" | "occurrenceCount">;
  topSpecies: SpeciesSummary[];
  taxonomicDistribution: TaxonomicDistribution;
  environmentalSnapshot: EnvironmentalSnapshot | null;
}

export interface FieldBrief {
  sections: {
    biodiversitySummary: string;
    notableRecords: string;
    environmentalContext: string;
    surveyPriorities: string;
    dataLimitations: string;
  };
  generatedAt: string;
  mode: "ai" | "deterministic-demo";
  model?: string;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}
