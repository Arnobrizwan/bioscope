"use client";

import dynamic from "next/dynamic";
import { Crosshair, LoaderCircle, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IntelligencePanel } from "@/features/explorer/intelligence-panel";
import { formatCoordinate } from "@/lib/utils";
import type {
  LocationCoordinates,
  LocationIntelligence,
  TaxonomicGroup,
} from "@/types/domain";

const BiodiversityMap = dynamic(
  () => import("@/components/map/biodiversity-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-slate-100 text-sm text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" /> Loading map…
      </div>
    ),
  },
);
const defaultLocation = { latitude: 4.2105, longitude: 101.9758 };
const quickLocations = [
  { label: "Malaysian rainforest", latitude: 4.55, longitude: 102.45 },
  { label: "Coastal area", latitude: 5.42, longitude: 100.24 },
];

export function ExplorerClient({
  initialLocation = defaultLocation,
  initialRadius = 25,
}: {
  initialLocation?: LocationCoordinates;
  initialRadius?: number;
}) {
  const [location, setLocation] =
    useState<LocationCoordinates>(initialLocation);
  const [radius, setRadius] = useState(initialRadius);
  const [data, setData] = useState<LocationIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeGroups, setActiveGroups] = useState<Set<TaxonomicGroup>>(
    new Set(),
  );
  const occurrences = useMemo(
    () =>
      data?.biodiversity.occurrences.filter(
        (item) => !activeGroups.size || activeGroups.has(item.taxonomicGroup),
      ) ?? [],
    [data, activeGroups],
  );

  async function analyze() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = new URLSearchParams({
        lat: String(location.latitude),
        lng: String(location.longitude),
        radius: String(radius),
      });
      const response = await fetch(`/api/location-intelligence?${params}`);
      const result = (await response.json()) as {
        data?: LocationIntelligence;
        error?: { message: string };
      };
      if (!response.ok || !result.data)
        throw new Error(result.error?.message || "Area analysis failed.");
      setData(result.data);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Area analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleGroup(group: TaxonomicGroup) {
    setActiveGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <div className="grid flex-1 lg:grid-cols-[255px_minmax(500px,1fr)_360px]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Area selection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Biodiversity Explorer
          </h1>
          <p className="mt-2 text-sm leading-5 text-slate-500">
            Click or drag the marker to select a survey area.
          </p>
          <div className="mt-6 space-y-3">
            <Coordinate
              label="Latitude"
              value={formatCoordinate(location.latitude, "lat")}
            />
            <Coordinate
              label="Longitude"
              value={formatCoordinate(location.longitude, "lng")}
            />
          </div>
          <label
            className="mt-6 block text-xs font-semibold text-slate-700"
            htmlFor="radius"
          >
            Search radius
          </label>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[5, 10, 25, 50].map((value) => (
              <button
                id={value === 5 ? "radius" : undefined}
                key={value}
                onClick={() => setRadius(value)}
                className={`rounded-md border px-2 py-2 text-xs font-semibold ${radius === value ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {value} km
              </button>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={analyze} disabled={loading}>
            {loading ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Search size={17} />
            )}{" "}
            Analyze Area
          </Button>
          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}
          <div className="mt-7 border-t border-slate-200 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Examples
            </p>
            <div className="mt-3 space-y-2">
              {quickLocations.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setLocation(item)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <MapPin size={15} className="text-emerald-700" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {data && (
            <div className="mt-7 border-t border-slate-200 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Marker filters
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(
                  [
                    "birds",
                    "mammals",
                    "reptiles",
                    "amphibians",
                    "plants",
                    "insects",
                    "other",
                  ] as TaxonomicGroup[]
                ).map((group) => (
                  <button
                    key={group}
                    onClick={() => toggleGroup(group)}
                    aria-pressed={activeGroups.has(group)}
                    className={`rounded-full border px-2.5 py-1 text-xs capitalize ${activeGroups.has(group) ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-500"}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
        <section className="relative min-h-[560px] lg:min-h-0">
          <BiodiversityMap
            selected={location}
            onSelect={setLocation}
            occurrences={occurrences}
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/50 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow">
            <Crosshair className="mr-1.5 inline" size={14} />
            {occurrences.length
              ? `${occurrences.length} mappable records`
              : "Select a location"}
          </div>
        </section>
        <IntelligencePanel data={data} loading={loading} />
      </div>
    </main>
  );
}

function Coordinate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
