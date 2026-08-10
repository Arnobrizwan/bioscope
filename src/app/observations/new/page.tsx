import { ObservationForm } from "@/features/observations/observation-form";

export default function NewObservationPage() {
  return <main className="mx-auto w-full max-w-7xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Field operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Record field observation</h1><p className="mt-2 text-slate-500">Authenticated records are stored as PostGIS geography points.</p><div className="mt-7"><ObservationForm /></div></main>;
}
