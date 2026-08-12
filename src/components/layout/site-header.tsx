import Link from "next/link";
import { Binoculars, Menu } from "lucide-react";
import { ResearcherAuthControl } from "@/components/layout/researcher-auth-control";

const navigation = [
  ["Explorer", "/explorer"],
  ["Species", "/species"],
  ["Observations", "/observations"],
  ["Dashboard", "/dashboard"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="BioScope home"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-900 text-white">
            <Binoculars size={19} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-950">
              BioScope
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:block">
              Biodiversity intelligence
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {navigation.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
        </nav>
        <ResearcherAuthControl />
        <Menu className="md:hidden" aria-label="Navigation menu" />
      </div>
    </header>
  );
}
