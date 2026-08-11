import { fetchJson } from "@/lib/fetch-with-timeout";
import { classifyTaxon } from "@/services/biodiversity.service";
import type { LocationCoordinates, OccurrenceRecord } from "@/types/domain";

const GBIF_BASE_URL = "https://api.gbif.org/v1";
// Raw GBIF records are verbose. 200 keeps Next's provider-response cache below its 2 MB item limit
// for typical searches while still providing a representative, clusterable map sample.
const MAX_OCCURRENCES = 200;

interface GbifOccurrence {
  key?: number;
  scientificName?: string;
  species?: string;
  vernacularName?: string;
  genus?: string;
  family?: string;
  class?: string;
  order?: string;
  kingdom?: string;
  taxonKey?: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  eventDate?: string;
  basisOfRecord?: string;
  media?: Array<{ identifier?: string }>;
}

interface GbifOccurrenceResponse {
  count: number;
  results: GbifOccurrence[];
}

export interface GbifSpeciesResult {
  key: number;
  scientificName: string;
  canonicalName?: string;
  vernacularName?: string;
  rank?: string;
  kingdom?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

function coordinateSearchPolygon(
  location: LocationCoordinates,
  radiusKm: number,
): string {
  const earthRadiusKm = 6_371;
  const angularDistance = radiusKm / earthRadiusKm;
  const latitude = (location.latitude * Math.PI) / 180;
  const longitude = (location.longitude * Math.PI) / 180;
  const points = Array.from({ length: 33 }, (_, index) => {
    // GBIF requires exterior WKT rings to use counter-clockwise winding.
    const bearing = -((index % 32) * 2 * Math.PI) / 32;
    const destinationLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const destinationLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) -
          Math.sin(latitude) * Math.sin(destinationLatitude),
      );
    return `${(destinationLongitude * 180) / Math.PI} ${(destinationLatitude * 180) / Math.PI}`;
  });
  return `POLYGON((${points.join(",")}))`;
}

export function normalizeGbifOccurrence(
  raw: GbifOccurrence,
): OccurrenceRecord | null {
  if (
    raw.key === undefined ||
    !raw.scientificName ||
    raw.decimalLatitude === undefined ||
    raw.decimalLongitude === undefined
  ) {
    return null;
  }

  return {
    id: String(raw.key),
    scientificName: raw.scientificName,
    commonName: raw.vernacularName,
    species: raw.species,
    genus: raw.genus,
    family: raw.family,
    className: raw.class,
    order: raw.order,
    kingdom: raw.kingdom,
    taxonKey: raw.taxonKey,
    latitude: raw.decimalLatitude,
    longitude: raw.decimalLongitude,
    eventDate: raw.eventDate,
    basisOfRecord: raw.basisOfRecord,
    mediaUrl: raw.media?.find((item) => item.identifier)?.identifier,
    taxonomicGroup: classifyTaxon(raw.class, raw.kingdom),
  };
}

export async function searchOccurrences(
  params: LocationCoordinates & { radiusKm: number },
) {
  const url = new URL(`${GBIF_BASE_URL}/occurrence/search`);
  url.searchParams.set(
    "geometry",
    coordinateSearchPolygon(params, params.radiusKm),
  );
  url.searchParams.set("has_coordinate", "true");
  url.searchParams.set("occurrence_status", "present");
  url.searchParams.set("limit", String(MAX_OCCURRENCES));

  const response = await fetchJson<GbifOccurrenceResponse>(url, "GBIF", {
    next: { revalidate: 3_600 },
  });

  return {
    providerCount: response.count,
    records: response.results
      .map(normalizeGbifOccurrence)
      .filter((item): item is OccurrenceRecord => item !== null),
  };
}

export async function searchSpecies(
  query: string,
): Promise<GbifSpeciesResult[]> {
  const url = new URL(`${GBIF_BASE_URL}/species/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  const response = await fetchJson<{ results: GbifSpeciesResult[] }>(
    url,
    "GBIF",
    {
      next: { revalidate: 86_400 },
    },
  );
  return response.results;
}

export async function getSpeciesDetails(
  taxonKey: number,
): Promise<GbifSpeciesResult> {
  return fetchJson<GbifSpeciesResult>(
    `${GBIF_BASE_URL}/species/${taxonKey}`,
    "GBIF",
    {
      next: { revalidate: 86_400 },
    },
  );
}

export async function getOccurrencesByTaxon(taxonKey: number) {
  const url = new URL(`${GBIF_BASE_URL}/occurrence/search`);
  url.searchParams.set("taxon_key", String(taxonKey));
  url.searchParams.set("has_coordinate", "true");
  url.searchParams.set("limit", "100");
  return fetchJson<GbifOccurrenceResponse>(url, "GBIF", {
    next: { revalidate: 3_600 },
  });
}
