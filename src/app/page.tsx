import Link from "next/link";
import { ArrowRight, Database, Map, Satellite, ShieldCheck } from "lucide-react";

const metrics = [
  { label: "Occurrence data", value: "GBIF", icon: Database },
  { label: "Environmental context", value: "NASA POWER", icon: Satellite },
  { label: "Spatial persistence", value: "PostGIS", icon: Map },
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#f4f7f4]">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,#7ca98b_0,transparent_42%)] opacity-25" />
          <div className="absolute right-20 top-20 h-72 w-96 rotate-3 rounded-[38px] border border-emerald-900/15 bg-white/65 p-6 shadow-2xl shadow-emerald-950/10"><div className="h-full rounded-2xl bg-[linear-gradient(135deg,#dcebe1_25%,#8eb59a_25%,#8eb59a_38%,#b5cfc0_38%,#b5cfc0_63%,#72967f_63%)] opacity-90" /><span className="absolute left-1/2 top-1/2 size-4 rounded-full border-4 border-white bg-emerald-800 shadow-lg" /></div>
        </div>
        <div className="relative mx-auto grid min-h-[570px] max-w-[1400px] items-center px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">Biodiversity intelligence & field operations</p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-6xl">Understand biodiversity through data.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Explore species occurrences, environmental conditions and field observations through an integrated geospatial intelligence platform.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/explorer" className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Open Biodiversity Explorer <ArrowRight size={16} /></Link><Link href="/dashboard" className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">View Dashboard</Link></div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={16} className="text-emerald-700" /> Scientific-source attribution and explicit data limitations</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10"><div className="grid gap-4 md:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"><span className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-800"><Icon size={20} /></span><div><p className="text-sm text-slate-500">{label}</p><p className="mt-0.5 font-semibold text-slate-950">{value}</p></div></div>)}</div></section>
    </main>
  );
}
