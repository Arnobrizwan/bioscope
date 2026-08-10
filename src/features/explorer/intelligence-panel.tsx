"use client";

import { AlertTriangle, Bot, CloudRain, Droplets, Leaf, LoaderCircle, Sun, Thermometer, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFieldBriefInput } from "@/lib/build-field-brief-input";
import type { FieldBrief, LocationIntelligence, TaxonomicGroup } from "@/types/domain";
import { useState } from "react";

const groups: Array<[TaxonomicGroup, string]> = [["birds", "Birds"], ["mammals", "Mammals"], ["reptiles", "Reptiles"], ["amphibians", "Amphibians"], ["plants", "Plants"], ["insects", "Insects"], ["other", "Other"]];

export function IntelligencePanel({ data, loading }: { data: LocationIntelligence | null; loading: boolean }) {
  const [brief, setBrief] = useState<FieldBrief | null>(null);
  const [briefError, setBriefError] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);

  async function generateBrief() {
    if (!data) return;
    setBriefLoading(true); setBriefError("");
    try {
      const response = await fetch("/api/field-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildFieldBriefInput(data)) });
      const result = await response.json() as { data?: FieldBrief; error?: { message: string } };
      if (!response.ok || !result.data) throw new Error(result.error?.message || "Unable to generate field brief.");
      setBrief(result.data);
    } catch (error) { setBriefError(error instanceof Error ? error.message : "Unable to generate field brief."); }
    finally { setBriefLoading(false); }
  }

  if (loading) return <aside className="h-full overflow-auto border-l border-slate-200 bg-white p-5" aria-live="polite"><div className="flex items-center gap-3 text-sm font-medium text-slate-600"><LoaderCircle className="animate-spin" size={18} /> Integrating GBIF and NASA POWER data…</div><div className="mt-7 space-y-3">{[1,2,3,4].map((item) => <div key={item} className="loading-pulse h-20 rounded-xl bg-slate-100" />)}</div></aside>;
  if (!data) return <aside className="h-full overflow-auto border-l border-slate-200 bg-white p-6"><div className="rounded-xl border border-dashed border-slate-300 p-5"><Trees className="text-emerald-800" /><h2 className="mt-4 font-semibold">Location intelligence</h2><p className="mt-2 text-sm leading-6 text-slate-500">Select a point on the map, choose a radius, and analyze the area to retrieve biodiversity and environmental context.</p></div></aside>;

  const env = data.environment;
  return (
    <aside className="h-full overflow-auto border-l border-slate-200 bg-white" aria-live="polite">
      <div className="border-b border-slate-200 p-5"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Biodiversity</p><div className="mt-3 grid grid-cols-2 gap-3"><Metric label="Species" value={data.biodiversity.speciesCount} /><Metric label="Occurrences" value={data.biodiversity.occurrenceCount} /></div></div>
      {data.metadata.warnings.length > 0 && <div className="m-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900"><AlertTriangle className="mt-0.5 shrink-0" size={16} /><span>{data.metadata.warnings.join(" ")}</span></div>}
      <section className="border-b border-slate-200 p-5"><h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Taxonomic groups</h3><div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5">{groups.map(([key, label]) => <div key={key} className="flex items-center justify-between text-sm"><span className="text-slate-600">{label}</span><strong>{data.biodiversity.taxonomicDistribution[key]}</strong></div>)}</div></section>
      <section className="border-b border-slate-200 p-5"><h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Recent meteorological context</h3>{env ? <div className="mt-4 grid grid-cols-2 gap-3"><Environment icon={Thermometer} label="Temperature" value={env.temperature} unit={env.units.temperature} /><Environment icon={CloudRain} label="Rainfall" value={env.precipitation} unit={env.units.precipitation} /><Environment icon={Droplets} label="Humidity" value={env.humidity} unit={env.units.humidity} /><Environment icon={Sun} label="Solar radiation" value={env.solarRadiation} unit={env.units.solarRadiation} /></div> : <p className="mt-3 text-sm text-slate-500">Environmental data unavailable.</p>}</section>
      <section className="p-5"><h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Frequent records in query</h3><div className="mt-3 space-y-2">{data.biodiversity.species.slice(0,5).map((species) => <div key={`${species.taxonKey}-${species.scientificName}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium italic">{species.scientificName}</p><p className="text-xs text-slate-500">{species.taxonomicGroup}</p></div><span className="ml-3 text-xs font-bold text-slate-600">{species.occurrenceCount}</span></div>)}</div><Button className="mt-5 w-full" onClick={generateBrief} disabled={briefLoading}><Bot size={17} /> {briefLoading ? "Generating…" : "Generate Field Brief"}</Button>{briefError && <p className="mt-2 text-sm text-red-700">{briefError}</p>}{brief && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-center gap-2"><Leaf size={16} className="text-blue-800" /><strong className="text-sm">AI-assisted interpretation</strong></div>{brief.mode === "deterministic-demo" && <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Demo summary — no AI key configured</p>}<p className="mt-3 text-sm leading-6 text-slate-700">{brief.sections.biodiversitySummary}</p><p className="mt-2 text-sm leading-6 text-slate-700">{brief.sections.surveyPriorities}</p><p className="mt-2 text-xs leading-5 text-slate-500">{brief.sections.dataLimitations}</p></div>}<p className="mt-4 text-[11px] leading-4 text-slate-400">Occurrence data: GBIF. Environmental context: NASA POWER. Results are not exhaustive population data.</p></section>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-800">{label}</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{value.toLocaleString()}</p></div>; }
function Environment({ icon: Icon, label, value, unit }: { icon: typeof Thermometer; label: string; value?: number; unit: string }) { return <div className="rounded-lg border border-slate-200 p-3"><Icon size={16} className="text-blue-700" /><p className="mt-2 text-xs text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold">{value === undefined ? "Unavailable" : `${value} ${unit}`}</p></div>; }
