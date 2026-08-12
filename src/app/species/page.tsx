import { SpeciesSearch } from "@/features/species/species-search";
export default function SpeciesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
        GBIF species backbone
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Species search
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-500">
        Inspect taxonomic records and occurrence coverage. Conservation status
        is intentionally not inferred from occurrence data.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Results prefer accepted GBIF backbone taxa and merge duplicate name
        usages from other checklists.
      </p>
      <SpeciesSearch />
    </main>
  );
}
