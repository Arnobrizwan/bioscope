"use client";

import Link from "next/link";
import { LoaderCircle, RotateCcw, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { GbifSpeciesResult } from "@/services/gbif.service";

type SpeciesGroup =
  | "All"
  | "Birds"
  | "Mammals"
  | "Reptiles"
  | "Amphibians"
  | "Plants"
  | "Insects";

const groups: SpeciesGroup[] = [
  "All",
  "Birds",
  "Mammals",
  "Reptiles",
  "Amphibians",
  "Plants",
  "Insects",
];

// A compact, verified GBIF backbone browse set gives the page useful breadth
// before a researcher enters a query. Search results still come from live GBIF.
const featuredSpecies: GbifSpeciesResult[] = [
  {
    key: 2476004,
    scientificName: "Buceros rhinoceros Linnaeus, 1758",
    canonicalName: "Buceros rhinoceros",
    vernacularName: "Rhinoceros hornbill",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Animalia",
    class: "Aves",
    family: "Bucerotidae",
  },
  {
    key: 7818962,
    scientificName: "Tapirus indicus (Desmarest, 1819)",
    canonicalName: "Tapirus indicus",
    vernacularName: "Malayan tapir",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Animalia",
    class: "Mammalia",
    family: "Tapiridae",
  },
  {
    key: 2470685,
    scientificName: "Varanus salvator (Laurenti, 1768)",
    canonicalName: "Varanus salvator",
    vernacularName: "Asian water monitor",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Animalia",
    class: "Squamata",
    family: "Varanidae",
  },
  {
    key: 2423785,
    scientificName: "Polypedates leucomystax (Gravenhorst, 1829)",
    canonicalName: "Polypedates leucomystax",
    vernacularName: "Common tree frog",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Animalia",
    class: "Amphibia",
    family: "Rhacophoridae",
  },
  {
    key: 4097193,
    scientificName: "Shorea leprosula Miq.",
    canonicalName: "Shorea leprosula",
    vernacularName: "Red meranti",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Plantae",
    class: "Magnoliopsida",
    family: "Dipterocarpaceae",
  },
  {
    key: 1937514,
    scientificName: "Trogonoptera brookiana (Wallace, 1855)",
    canonicalName: "Trogonoptera brookiana",
    vernacularName: "Rajah Brooke's birdwing",
    rank: "SPECIES",
    taxonomicStatus: "ACCEPTED",
    isBackbone: true,
    kingdom: "Animalia",
    class: "Insecta",
    family: "Papilionidae",
  },
];

function speciesGroup(item: GbifSpeciesResult): Exclude<SpeciesGroup, "All"> {
  if (item.class === "Aves") return "Birds";
  if (item.class === "Mammalia") return "Mammals";
  if (item.class === "Amphibia") return "Amphibians";
  if (item.class === "Insecta") return "Insects";
  if (item.kingdom === "Plantae") return "Plants";
  return "Reptiles";
}

export function SpeciesSearch() {
  const [results, setResults] =
    useState<GbifSpeciesResult[]>(featuredSpecies);
  const [loading, setLoading] = useState(false);
  const [browseMode, setBrowseMode] = useState(true);
  const [activeGroup, setActiveGroup] = useState<SpeciesGroup>("All");
  const [message, setMessage] = useState(
    "Browse representative Malaysian taxa or search GBIF by common or scientific name.",
  );
  const visibleResults = useMemo(
    () =>
      activeGroup === "All"
        ? results
        : results.filter((item) => speciesGroup(item) === activeGroup),
    [activeGroup, results],
  );

  function showFeaturedSpecies() {
    setResults(featuredSpecies);
    setBrowseMode(true);
    setActiveGroup("All");
    setMessage(
      "Browse representative Malaysian taxa or search GBIF by common or scientific name.",
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("query");
    setLoading(true);
    try {
      const response = await fetch(
        `/api/species?q=${encodeURIComponent(String(query))}`,
      );
      const body = (await response.json()) as {
        data?: GbifSpeciesResult[];
        error?: { message: string };
      };
      if (!response.ok) throw new Error(body.error?.message);
      setResults(body.data ?? []);
      setBrowseMode(false);
      setActiveGroup("All");
      setMessage(
        body.data?.length
          ? `${body.data.length} distinct taxonomy matches from GBIF.`
          : "No taxonomy matches were returned.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Species search failed.",
      );
      setResults([]);
      setBrowseMode(false);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className="mt-7 flex max-w-2xl gap-2">
        <label className="sr-only" htmlFor="species-query">
          Species name
        </label>
        <input
          id="species-query"
          name="query"
          minLength={2}
          required
          placeholder="e.g. Malayan tiger or Panthera tigris"
          className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
        <Button className="h-11" disabled={loading}>
          {loading ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <Search size={16} />
          )}
          Search
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" aria-live="polite">
          {message}
        </p>
        {!browseMode && (
          <button
            type="button"
            onClick={showFeaturedSpecies}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
          >
            <RotateCcw size={14} /> Browse featured species
          </button>
        )}
      </div>
      <div
        className="mt-5 flex flex-wrap gap-2"
        aria-label="Filter species groups"
      >
        {groups.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setActiveGroup(group)}
            aria-pressed={activeGroup === group}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${activeGroup === group ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}
          >
            {group}
          </button>
        ))}
      </div>
      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleResults.map((item) => (
          <Link
            href={`/species/${item.key}`}
            key={item.key}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  {speciesGroup(item)}
                </p>
                <h2 className="font-semibold italic">
                  {item.canonicalName || item.scientificName}
                </h2>
                {item.vernacularName && (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.vernacularName}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                  {item.rank || "taxon"}
                </span>
                <span
                  className={
                    item.isBackbone
                      ? "rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800"
                      : "rounded bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-800"
                  }
                >
                  {item.isBackbone ? "GBIF backbone" : "Checklist taxon"}
                </span>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {[item.kingdom, item.class, item.family]
                .filter(Boolean)
                .join(" · ") || "Taxonomy unavailable"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
