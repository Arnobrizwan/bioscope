"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ClipboardList, LoaderCircle, LocateFixed, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FieldObservation, LocationCoordinates } from "@/types/domain";

const Map = dynamic(() => import("@/components/map/biodiversity-map"), {
  ssr: false,
});
const malaysiaCenter = { latitude: 4.2105, longitude: 101.9758 };

export function ObservationsClient() {
  const [items, setItems] = useState<FieldObservation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "auth" | "error">(
    "loading",
  );
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
        setItems(observations);
        if (observations[0]) {
          setCenter({
            latitude: observations[0].latitude,
            longitude: observations[0].longitude,
          });
        }
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSpecies = species.trim().toLowerCase();
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    return items.filter((item) => {
      const matchesSpecies =
        !normalizedSpecies ||
        item.speciesName.toLowerCase().includes(normalizedSpecies) ||
        item.scientificName?.toLowerCase().includes(normalizedSpecies);
      const matchesDate =
        start === null || new Date(item.observedAt).getTime() >= start;
      return matchesSpecies && matchesDate;
    });
  }, [dateFrom, items, species]);
  const mapItems = filteredItems.map((item) => ({
    ...item,
    scientificName: item.scientificName || item.speciesName,
    taxonomicGroup: "other" as const,
  }));

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
      const response = await fetch(`/api/observations/nearby?${params}`);
      const body = (await response.json()) as {
        data?: FieldObservation[];
        error?: { message: string };
      };
      if (!response.ok)
        throw new Error(body.error?.message || "Nearby search failed.");
      setItems(body.data ?? []);
      setFilterMessage(
        `${body.data?.length ?? 0} observations found within ${radius} km.`,
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
              Search nearby
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Map center: {center.latitude.toFixed(4)},{" "}
            {center.longitude.toFixed(4)}. Click the map to change the
            spatial-query origin.
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
          <Map
            selected={center}
            onSelect={status === "ready" ? setCenter : undefined}
            occurrences={mapItems}
            className="h-[560px] w-full"
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="animate-spin" size={16} />
              Loading observations…
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
          {status === "ready" && !filteredItems.length && (
            <Empty
              title="No matching observations"
              text="Adjust the species, date, map center, or radius—or record your first field observation."
              action="/observations/new"
              actionLabel="Add observation"
            />
          )}
          {status === "ready" && filteredItems.length > 0 && (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{item.speciesName}</h2>
                        {item.notes?.startsWith("Demo data:") && (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                            Demo data
                          </span>
                        )}
                      </div>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
            <Plus size={15} />
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
