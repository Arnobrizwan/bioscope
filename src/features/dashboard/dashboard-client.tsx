"use client";

import Link from "next/link";
import { ClipboardList, MapPinned, Microscope, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  FieldObservation,
  LocationIntelligence,
  SavedLocation,
} from "@/types/domain";

export function DashboardClient() {
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [intelligence, setIntelligence] = useState<LocationIntelligence | null>(
    null,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [externalStatus, setExternalStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");

  useEffect(() => {
    Promise.all([fetch("/api/observations"), fetch("/api/saved-locations")])
      .then(async ([observationResponse, locationResponse]) => {
        if (!observationResponse.ok || !locationResponse.ok) {
          setStatus("unavailable");
          return;
        }
        const observationBody = (await observationResponse.json()) as {
          data: FieldObservation[];
        };
        const locationBody = (await locationResponse.json()) as {
          data: SavedLocation[];
        };
        setObservations(observationBody.data);
        setLocations(locationBody.data);
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));
  }, []);

  useEffect(() => {
    fetch("/api/location-intelligence?lat=4.2105&lng=101.9758&radius=25")
      .then(async (response) => {
        const body = (await response.json()) as {
          data?: LocationIntelligence;
        };
        if (!response.ok || !body.data) {
          setExternalStatus("unavailable");
          return;
        }
        setIntelligence(body.data);
        setExternalStatus("ready");
      })
      .catch(() => setExternalStatus("unavailable"));
  }, []);

  const chart = useMemo(() => {
    if (!intelligence) return [];
    return Object.entries(intelligence.biodiversity.taxonomicDistribution).map(
      ([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }),
    );
  }, [intelligence]);
  const isReady = status === "ready";
  const cards = [
    {
      label: "Species identified",
      value: intelligence?.biodiversity.speciesCount ?? 0,
      note: "Live GBIF map sample",
      icon: Microscope,
      ready: externalStatus === "ready",
    },
    {
      label: "Biodiversity occurrences",
      value: intelligence?.biodiversity.occurrenceCount ?? 0,
      note: "Mappable GBIF records",
      icon: ScanSearch,
      ready: externalStatus === "ready",
    },
    {
      label: "Saved observations",
      value: observations.length,
      note: "Your PostGIS records",
      icon: ClipboardList,
      ready: isReady,
    },
    {
      label: "Survey locations",
      value: locations.length,
      note: "Saved analysis areas",
      icon: MapPinned,
      ready: isReady,
    },
  ];

  return (
    <>
      <div
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-live="polite"
      >
        {cards.map(({ label, value, note, icon: Icon, ready }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className="text-emerald-700" />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {ready ? value.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {ready
                ? note
                : label.startsWith("Species") ||
                    label.startsWith("Biodiversity")
                  ? externalStatus === "loading"
                    ? "Loading live GBIF data…"
                    : "GBIF temporarily unavailable"
                  : status === "loading"
                    ? "Loading researcher data…"
                    : "Sign in / configure Supabase"}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Live taxonomic distribution</h2>
          <p className="mt-1 text-sm text-slate-500">
            GBIF occurrence records near central Peninsular Malaysia · 25 km
          </p>
          <div className="mt-6 h-72">
            {chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#166534" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                {externalStatus === "loading"
                  ? "Loading live GBIF distribution…"
                  : "GBIF distribution unavailable."}
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Occurrence records are not abundance estimates and may contain
            geographic, temporal, and sampling bias.
          </p>
        </section>
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Recent field observations</h2>
            <div className="mt-4 space-y-3">
              {observations.slice(0, 4).map((observation) => (
                <div
                  key={observation.id}
                  className="border-b border-slate-100 pb-3"
                >
                  <p className="text-sm font-medium">
                    {observation.speciesName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(observation.observedAt).toLocaleDateString()} ·{" "}
                    {observation.latitude.toFixed(3)},{" "}
                    {observation.longitude.toFixed(3)}
                  </p>
                </div>
              ))}
              {!observations.length && (
                <EmptyDashboardCopy text="No personal observation records yet." />
              )}
            </div>
            <Link
              href="/observations/new"
              className="mt-5 inline-block text-sm font-semibold text-emerald-800"
            >
              Add an observation →
            </Link>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Recent explored locations</h2>
            <div className="mt-4 space-y-3">
              {locations.slice(0, 4).map((location) => (
                <Link
                  key={location.id}
                  href={`/explorer?lat=${location.latitude}&lng=${location.longitude}&radius=${location.radiusKm}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <p className="text-sm font-medium">{location.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {location.latitude.toFixed(3)},{" "}
                    {location.longitude.toFixed(3)} · {location.radiusKm} km
                  </p>
                </Link>
              ))}
              {!locations.length && (
                <EmptyDashboardCopy text="Save an analyzed area from Explorer to see it here." />
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function EmptyDashboardCopy({ text }: { text: string }) {
  return (
    <p className="text-sm leading-6 text-slate-500">
      {text} Dashboard values remain empty rather than using fabricated
      statistics.
    </p>
  );
}
