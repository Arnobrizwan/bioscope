"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResearcherAuthControl() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      router.push("/");
      router.refresh();
      return;
    }
    setSigningOut(false);
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:block"
      >
        Researcher sign in
      </Link>
    );
  }

  const researcherLabel =
    typeof user.user_metadata.display_name === "string" &&
    user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : user.email || "Researcher";

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className="max-w-48 truncate text-sm font-medium text-slate-700"
        title={researcherLabel}
      >
        {researcherLabel}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
