import Link from "next/link";
import { Bot } from "lucide-react";
export default function IntelligencePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Bot className="text-emerald-800" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
          Decision support
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          AI-assisted field intelligence
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Field briefs are generated from the compact normalized result of an
          area analysis—not raw provider payloads. They are constrained to
          supplied evidence and explicitly disclose sampling bias and
          uncertainty.
        </p>
        <Link
          href="/explorer"
          className="mt-6 inline-flex rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Analyze an area to generate a brief
        </Link>
      </div>
    </main>
  );
}
