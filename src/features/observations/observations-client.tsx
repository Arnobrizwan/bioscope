"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ClipboardList,
  ExternalLink,
  LoaderCircle,
  LocateFixed,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  FieldObservation,
  LocationCoordinates,
  OccurrenceRecord,
} from "@/types/domain";

const Map = dynamic(() => import("@/components/map/biodiversity-map"), {
  ssr: false,
});
const malaysiaCenter = { latitude: 4.2105, longitude: 101.9758 };

interface OccurrenceResponse {
  data?: {
    occurrences: OccurrenceRecord[];
    providerCount: number;
    source: { provider: "GBIF"; url: string };
  };
  error?: { message: string };
}

export function ObservationsClient() {
  const [items, setItems] = useState<FieldObservation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "auth" | "error">(
    "loading",
  );
  const [referenceRecords, setReferenceRecords] = useState<OccurrenceRecord[]>(
    [],
  );
  const [providerCount, setProviderCount] = useState(0);
  const [referenceStatus, setReferenceStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [species, setSpecies] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [radius, setRadius] = useState(25);
  const [center, setCenter] = useState<LocationCoordinates>(malaysiaCenter);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [filterMessage, setFilterMessage] = useState("");

  useEffect(() => {
    fetch("/api/observations")
      .then(async (response) => {
        const body = (await response.json()) as { data?: FieldObservation[] };
        if (response.status === 401) return setStatus("auth");
        if (!response.ok) return setStatus("error");
        const observations = body.data ?? [];
        const initialCenter = observations[0]
          ? {
              latitude: observations[0].latitude,
              longitude: observations[0].longitude,
            }
          : malaysiaCenter;
        setItems(observations);
        setCenter(initialCenter);
        setStatus("ready");
        void loadReferenceOccurrences(initialCenter, 25);
      })
      .catch(() => setStatus("error"));
  }, []);

  const normalizedSpecies = species.trim().toLowerCase();
  const startDate = dateFrom
    ? new Date(`${dateFrom}T00:00:00`).getTime()
    : null;
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSpecies =
          !normalizedSpecies ||
          item.speciesName.toLowerCase().includes(normalizedSpecies) ||
          item.scientificName?.toLowerCase().includes(normalizedSpecies);
        const matchesDate =
          startDate === null ||
          new Date(item.observedAt).getTime() >= startDate;
        return matchesSpecies && matchesDate;
      }),
    [items, normalizedSpecies, startDate],
  );
  const filteredReferences = useMemo(
    () =>
      referenceRecords.filter((record) => {
        const matchesSpecies =
          !normalizedSpecies ||
          record.scientificName.toLowerCase().includes(normalizedSpecies) ||
          record.commonName?.toLowerCase().includes(normalizedSpecies);
        const matchesDate =
          startDate === null ||
          !record.eventDate ||
          new Date(record.eventDate).getTime() >= startDate;
        return matchesSpecies && matchesDate;
      }),
    [normalizedSpecies, referenceRecords, startDate],
  );
  const personalMapItems = filteredItems.map((item) => ({
    ...item,
    scientificName: item.scientificName || item.speciesName,
    commonName: item.speciesName,
    taxonomicGroup: "other" as const,
  }));
  const mapItems = [...personalMapItems, ...filteredReferences].slice(0, 200);

  async function loadReferenceOccurrences(
    location: LocationCoordinates,
    searchRadius: number,
  ) {
    setReferenceStatus("loading");
    try {
      const params = new URLSearchParams({
        lat: String(location.latitude),
        lng: String(location.longitude),
        radius: String(searchRadius),
      });
      const response = await fetch(`/api/occurrences?${params}`);
      const body = (await response.json()) as OccurrenceResponse;
      if (!response.ok || !body.data) {
        throw new Error(
          body.error?.message || "GBIF occurrence data unavailable.",
        );
      }
      setReferenceRecords(body.data.occurrences);
      setProviderCount(body.data.providerCount);
      setReferenceStatus("ready");
      return body.data.occurrences.length;
    } catch {
      setReferenceRecords([]);
      setProviderCount(0);
      setReferenceStatus("error");
      return 0;
    }
  }

  async function runNearbySearch() {
    setNearbyLoading(true);
    setFilterMessage("");
    try {
      const params = new URLSearchParams({
        lat: String(center.latitude),
        lng: String(center.longitude),
        radius: String(radius),
      });
      if (species.trim()) params.set("species", species.trim());
      const [response, gbifCount] = await Promise.all([
        fetch(`/api/observations/nearby?${params}`),
        loadReferenceOccurrences(center, radius),
      ]);
      const body = (await response.json()) as {
        data?: FieldObservation[];
        error?: { message: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message || "Nearby search failed.");
      }
      setItems(body.data ?? []);
      setFilterMessage(
        `${body.data?.length ?? 0} personal observations and ${gbifCount} georeferenced GBIF reference records loaded within ${radius} km.`,
      );
    } catch (error) {
      setFilterMessage(
        error instanceof Error ? error.message : "Nearby search failed.",
      );
    } finally {
      setNearbyLoading(false);
    }
  }

  return (
    <div className="mt-7">
      {status === "ready" && (
        <section
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-label="Observation filters"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_180px_130px_auto]">
            <label className="text-xs font-semibold text-slate-600">
              Species or scientific name
              <input
                value={species}
                onChange={(event) => setSpecies(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                placeholder="Filter taxonomy"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Observed after
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Radius
              <select
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
              >
                {[5, 10, 25, 50].map((value) => (
                  <option key={value} value={value}>
                    {value} km
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="mt-auto"
              onClick={runNearbySearch}
              disabled={nearbyLoading}
            >
              {nearbyLoading ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <LocateFixed size={16} />
              )}
              Refresh area
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Map center: {center.latitude.toFixed(4)},{" "}
            {center.longitude.toFixed(4)}. Click the map to change the PostGIS
            and GBIF query origin.
          </p>
          {filterMessage && (
            <p className="mt-2 text-sm text-emerald-800" aria-live="polite">
              {filterMessage}
            </p>
          )}
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-xs">
            <span className="font-semibold text-slate-700">
              {filteredItems.length} personal · {filteredReferences.length} GBIF
              georeferenced GBIF map records
            </span>
            <span className="text-slate-500">
              Maximum 200 clustered markers
            </span>
          </div>
          <Map
            selected={center}
            onSelect={status === "ready" ? setCenter : undefined}
            occurrences={mapItems}
            className="h-[516px] w-full"
          />
        </div>
        <div className="max-h-[560px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="animate-spin" size={16} /> Loading
              observations…
            </p>
          )}
          {status === "auth" && (
            <Empty
              title="Authentication required"
              text="Sign in to view and manage your private field observations."
              action="/login"
              actionLabel="Sign in"
            />
          )}
          {status === "error" && (
            <Empty
              title="Observations unavailable"
              text="The database could not be reached. Check Supabase configuration."
            />
          )}
          {status === "ready" && (
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Your field observations</h2>
                  <Link
                    href="/observations/new"
                    className="text-xs font-semibold text-emerald-800"
                  >
                    Add record
                  </Link>
                </div>
                {!filteredItems.length ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    No personal observations match this view. External GBIF
                    records below are reference evidence and are not saved as
                    your field observations.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {filteredItems.map((item) => (
                      <FieldObservationCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
              <section className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      Georeferenced GBIF occurrence reference
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Live free API · {providerCount.toLocaleString()}
                      coordinate-bearing provider matches · showing{" "}
                      {filteredReferences.length}
                    </p>
                  </div>
                  <a
                    href="https://www.gbif.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800"
                  >
                    GBIF <ExternalLink size={12} />
                  </a>
                </div>
                {referenceStatus === "loading" && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <LoaderCircle className="animate-spin" size={15} /> Loading
                    live GBIF records…
                  </p>
                )}
                {referenceStatus === "error" && (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    GBIF is temporarily unavailable. Your personal observations
                    remain accessible.
                  </p>
                )}
                {referenceStatus === "ready" && !filteredReferences.length && (
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    No GBIF records matched these filters. This does not
                    indicate species absence.
                  </p>
                )}
                {referenceStatus === "ready" &&
                  filteredReferences.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {filteredReferences.slice(0, 12).map((record) => (
                        <article
                          key={record.id}
                          className="rounded-lg border border-blue-100 bg-blue-50/30 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium italic">
                                {record.scientificName}
                              </p>
                              {record.commonName && (
                                <p className="mt-0.5 text-xs text-slate-600">
                                  {record.commonName}
                                </p>
                              )}
                            </div>
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">
                              GBIF
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatOccurrenceDate(record.eventDate)} ·{" "}
                            {record.latitude.toFixed(4)},{" "}
                            {record.longitude.toFixed(4)}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Occurrence frequency reflects submitted records, not true
                  abundance. GBIF data can contain geographic, temporal, and
                  sampling bias.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldObservationCard({ item }: { item: FieldObservation }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="font-semibold">{item.speciesName}</h3>
          {item.scientificName && (
            <p className="text-sm italic text-slate-500">
              {item.scientificName}
            </p>
          )}
        </div>
        <span className="h-fit rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
          × {item.count}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {new Date(item.observedAt).toLocaleString()} ·{" "}
        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        {item.distanceKm === undefined
          ? ""
          : ` · ${item.distanceKm.toFixed(2)} km`}
      </p>
    </article>
  );
}

function formatOccurrenceDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString();
}

function Empty({
  title,
  text,
  action,
  actionLabel,
}: {
  title: string;
  text: string;
  action?: string;
  actionLabel?: string;
}) {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div>
        <ClipboardList className="mx-auto text-slate-400" />
        <h2 className="mt-3 font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
          {text}
        </p>
        {action && (
          <Link
            href={action}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} /> {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
