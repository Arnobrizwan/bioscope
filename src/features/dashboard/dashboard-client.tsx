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
import type { FieldObservation, SavedLocation } from "@/types/domain";

export function DashboardClient() {
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

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

  const speciesCount = new Set(
    observations.map(
      (observation) => observation.scientificName || observation.speciesName,
    ),
  ).size;
  const chart = useMemo(() => {
    const counts = new Map<string, number>();
    observations.forEach((observation) =>
      counts.set(
        observation.speciesName,
        (counts.get(observation.speciesName) ?? 0) + observation.count,
      ),
    );
    return [...counts].slice(0, 6).map(([name, count]) => ({ name, count }));
  }, [observations]);
  const isReady = status === "ready";
  const cards = [
    {
      label: "Species identified",
      value: speciesCount,
      note: "Your observations",
      icon: Microscope,
    },
    {
      label: "Observation records",
      value: observations.length,
      note: "Database-backed",
      icon: ClipboardList,
    },
    {
      label: "Individuals recorded",
      value: observations.reduce(
        (sum, observation) => sum + observation.count,
        0,
      ),
      note: "Reported field counts",
      icon: ScanSearch,
    },
    {
      label: "Survey locations",
      value: locations.length,
      note: "Saved analysis areas",
      icon: MapPinned,
    },
  ];

  return (
    <>
      <div
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-live="polite"
      >
        {cards.map(({ label, value, note, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon size={18} className="text-emerald-700" />
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {isReady ? value.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {status === "loading"
                ? "Loading researcher data…"
                : isReady
                  ? note
                  : "Sign in / configure Supabase"}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Recorded species distribution</h2>
          <p className="mt-1 text-sm text-slate-500">
            Counts from the authenticated researcher&apos;s field records
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
                No observation data available.
              </div>
            )}
          </div>
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
