"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ClipboardList, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { FieldObservation } from "@/types/domain";

const Map = dynamic(() => import("@/components/map/biodiversity-map"), { ssr: false });

export function ObservationsClient() {
  const [items, setItems] = useState<FieldObservation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "auth" | "error">("loading");
  useEffect(() => { fetch("/api/observations").then(async (response) => { const body = await response.json() as { data?: FieldObservation[] }; if (response.status === 401) return setStatus("auth"); if (!response.ok) return setStatus("error"); setItems(body.data ?? []); setStatus("ready"); }).catch(() => setStatus("error")); }, []);
  const center = items[0] ?? { latitude: 4.2105, longitude: 101.9758 };
  const mapItems = items.map((item) => ({ ...item, scientificName: item.scientificName || item.speciesName, taxonomicGroup: "other" as const }));
  return <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Map selected={center} occurrences={mapItems} className="h-[560px] w-full" /></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{status === "loading" && <p className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Loading observations…</p>}{status === "auth" && <Empty title="Authentication required" text="Sign in to view and manage your private field observations." action="/login" actionLabel="Sign in" />}{status === "error" && <Empty title="Observations unavailable" text="The database could not be reached. Check Supabase configuration." />}{status === "ready" && !items.length && <Empty title="No observations yet" text="Record your first georeferenced field observation." action="/observations/new" actionLabel="Add observation" />}{status === "ready" && items.length > 0 && <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-4"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{item.speciesName}</h2>{item.scientificName && <p className="text-sm italic text-slate-500">{item.scientificName}</p>}</div><span className="h-fit rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">× {item.count}</span></div><p className="mt-3 text-xs text-slate-500">{new Date(item.observedAt).toLocaleString()} · {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p></article>)}</div>}</div>
  </div>;
}
function Empty({ title, text, action, actionLabel }: { title: string; text: string; action?: string; actionLabel?: string }) { return <div className="grid min-h-72 place-items-center text-center"><div><ClipboardList className="mx-auto text-slate-400" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{text}</p>{action && <Link href={action} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white"><Plus size={15} />{actionLabel}</Link>}</div></div>; }
