"use client";

import Link from "next/link";
import { LoaderCircle, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { GbifSpeciesResult } from "@/services/gbif.service";

export function SpeciesSearch() {
  const [results, setResults] = useState<GbifSpeciesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Search GBIF taxonomy by common or scientific name.");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const query = new FormData(event.currentTarget).get("query"); setLoading(true);
    try { const response = await fetch(`/api/species?q=${encodeURIComponent(String(query))}`); const body = await response.json() as { data?: GbifSpeciesResult[]; error?: { message: string } }; if (!response.ok) throw new Error(body.error?.message); setResults(body.data ?? []); setMessage(body.data?.length ? `${body.data.length} taxonomy matches from GBIF.` : "No taxonomy matches were returned."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Species search failed."); setResults([]); }
    finally { setLoading(false); }
  }
  return <><form onSubmit={submit} className="mt-7 flex max-w-2xl gap-2"><label className="sr-only" htmlFor="species-query">Species name</label><input id="species-query" name="query" minLength={2} required placeholder="e.g. Malayan tiger or Panthera tigris" className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /><Button className="h-11" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}Search</Button></form><p className="mt-3 text-sm text-slate-500" aria-live="polite">{message}</p><div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.map((item) => <Link href={`/species/${item.key}`} key={item.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold italic">{item.canonicalName || item.scientificName}</h2>{item.vernacularName && <p className="mt-1 text-sm text-slate-600">{item.vernacularName}</p>}</div><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{item.rank || "taxon"}</span></div><p className="mt-5 text-xs text-slate-500">{[item.kingdom, item.class, item.family].filter(Boolean).join(" · ") || "Taxonomy unavailable"}</p></Link>)}</div></>;
}
