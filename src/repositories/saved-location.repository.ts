import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import type { SavedLocationInput } from "@/schemas/saved-location.schema";
import type { SavedLocation } from "@/types/domain";

interface SavedLocationRow {
  id: string;
  user_id: string;
  label: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  created_at: string;
}

function toDomain(row: SavedLocationRow): SavedLocation {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusKm: row.radius_km,
    createdAt: row.created_at,
  };
}

export class SavedLocationRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listForUser(userId: string): Promise<SavedLocation[]> {
    const { data, error } = await this.db
      .from("saved_locations_with_coordinates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError("INTERNAL_ERROR", "Unable to load saved locations.");
    return (data as SavedLocationRow[]).map(toDomain);
  }

  async create(userId: string, input: SavedLocationInput): Promise<SavedLocation> {
    const { data, error } = await this.db.rpc("create_saved_location", {
      p_user_id: userId,
      p_label: input.label,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_radius_km: input.radiusKm,
    });
    if (error || !data) throw new AppError("INTERNAL_ERROR", "Unable to save location.");
    return toDomain((Array.isArray(data) ? data[0] : data) as SavedLocationRow);
  }
}
