import type { SupabaseClient } from "@supabase/supabase-js";
import type { ObservationInput } from "@/schemas/observation.schema";
import type { FieldObservation } from "@/types/domain";
import { AppError } from "@/lib/errors";

interface ObservationRow {
  id: string;
  user_id: string;
  species_name: string;
  scientific_name: string | null;
  taxon_key: number | null;
  latitude: number;
  longitude: number;
  observed_at: string;
  count: number;
  notes: string | null;
  evidence_url: string | null;
  is_public: boolean;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

function toDomain(row: ObservationRow): FieldObservation {
  return {
    id: row.id,
    userId: row.user_id,
    speciesName: row.species_name,
    scientificName: row.scientific_name ?? undefined,
    taxonKey: row.taxon_key ?? undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    observedAt: row.observed_at,
    count: row.count,
    notes: row.notes ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    isPublic: row.is_public,
    distanceKm: row.distance_km === undefined ? undefined : Number(row.distance_km),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ObservationRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listForUser(userId: string): Promise<FieldObservation[]> {
    const { data, error } = await this.db
      .from("field_observations_with_coordinates")
      .select("*")
      .eq("user_id", userId)
      .order("observed_at", { ascending: false });
    if (error) throw new AppError("INTERNAL_ERROR", "Unable to load observations.");
    return (data as ObservationRow[]).map(toDomain);
  }

  async create(userId: string, input: ObservationInput): Promise<FieldObservation> {
    // userId comes only from verified auth state; it is never accepted from request JSON.
    const { data, error } = await this.db.rpc("create_field_observation", {
      p_user_id: userId,
      p_species_name: input.speciesName,
      p_scientific_name: input.scientificName || null,
      p_taxon_key: input.taxonKey ?? null,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_observed_at: input.observedAt,
      p_count: input.count,
      p_notes: input.notes || null,
      p_evidence_url: input.evidenceUrl || null,
      p_is_public: input.isPublic,
    });
    if (error || !data) throw new AppError("INTERNAL_ERROR", "Unable to save observation.");
    return toDomain((Array.isArray(data) ? data[0] : data) as ObservationRow);
  }

  async nearby(
    userId: string,
    query: { lat: number; lng: number; radius: number; species?: string },
  ): Promise<FieldObservation[]> {
    const { data, error } = await this.db.rpc("nearby_field_observations", {
      p_user_id: userId,
      p_latitude: query.lat,
      p_longitude: query.lng,
      p_radius_km: query.radius,
      p_species: query.species || null,
    });
    if (error) throw new AppError("INTERNAL_ERROR", "Unable to run the spatial query.");
    return ((data ?? []) as ObservationRow[]).map(toDomain);
  }
}
