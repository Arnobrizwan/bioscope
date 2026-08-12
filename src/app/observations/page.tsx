import Link from "next/link";
import { Plus } from "lucide-react";
import { ObservationsClient } from "@/features/observations/observations-client";

export default function ObservationsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
            Field operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Field observations
          </h1>
          <p className="mt-2 text-slate-500">
            Your georeferenced survey records and evidence.
          </p>
        </div>
        <Link
          href="/observations/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Add observation
        </Link>
      </div>
      <ObservationsClient />
    </main>
  );
}
