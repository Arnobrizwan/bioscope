import { DashboardClient } from "@/features/dashboard/dashboard-client";
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
        Research workspace
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Researcher dashboard
      </h1>
      <p className="mt-2 text-slate-500">
        Personal, database-backed field activity. No unlabeled synthetic
        statistics.
      </p>
      <DashboardClient />
    </main>
  );
}
