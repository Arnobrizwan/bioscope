import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getGeoreferencedOccurrenceCountByTaxon,
  getSpeciesDetails,
} from "@/services/gbif.service";

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ taxonKey: string }>;
}) {
  const { taxonKey } = await params;
  const key = Number(taxonKey);
  if (!Number.isInteger(key) || key <= 0) notFound();
  let species;
  let occurrenceCount = 0;
  try {
    [species, occurrenceCount] = await Promise.all([
      getSpeciesDetails(key),
      getGeoreferencedOccurrenceCountByTaxon(key),
    ]);
  } catch {
    notFound();
  }
  const taxonomy = [
    ["Kingdom", species.kingdom],
    ["Class", species.class],
    ["Order", species.order],
    ["Family", species.family],
    ["Genus", species.genus],
  ];
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <Link
        href="/species"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
      >
        <ArrowLeft size={16} />
        Back to species search
      </Link>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            GBIF taxon {species.key}
          </p>
          <h1 className="mt-3 text-3xl font-semibold italic tracking-tight">
            {species.scientificName}
          </h1>
          {species.vernacularName && (
            <p className="mt-2 text-lg text-slate-600">
              {species.vernacularName}
            </p>
          )}
          <dl className="mt-8 divide-y divide-slate-100">
            {taxonomy.map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium italic">
                  {value || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Database className="text-emerald-800" />
          <p className="mt-4 text-sm text-slate-500">
            Global georeferenced GBIF occurrence records
          </p>
          <p className="mt-1 text-4xl font-semibold">
            {occurrenceCount.toLocaleString()}
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            This count represents indexed records with coordinates, not
            abundance, population size, species absence, or conservation status.
          </p>
          <a
            href={`https://www.gbif.org/occurrence/search?taxon_key=${species.key}&has_coordinate=true`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block text-sm font-semibold text-emerald-800 underline"
          >
            View georeferenced records on GBIF
          </a>
        </aside>
      </div>
    </main>
  );
}
