import type { Metadata } from "next";
import { ExplorerClient } from "@/features/explorer/explorer-client";

export const metadata: Metadata = { title: "Explorer" };
export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; radius?: string }>;
}) {
  const query = await searchParams;
  const latitude = Number(query.lat);
  const longitude = Number(query.lng);
  const radius = Number(query.radius);
  const initialLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
      ? { latitude, longitude }
      : undefined;
  const initialRadius = [5, 10, 25, 50].includes(radius) ? radius : undefined;

  return <ExplorerClient initialLocation={initialLocation} initialRadius={initialRadius} />;
}
