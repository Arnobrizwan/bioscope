"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); const email = String(new FormData(event.currentTarget).get("email")); const supabase = createSupabaseBrowserClient(); if (!supabase) { setMessage("Supabase is not configured. Add the public URL and anon key to enable authentication."); setLoading(false); return; } const callbackUrl = new URL("/auth/callback", window.location.origin); callbackUrl.searchParams.set("next", "/dashboard"); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl.toString() } }); setMessage(error ? error.message : "Check your email for a secure sign-in link."); setLoading(false); }
  return <form onSubmit={submit} className="mt-6"><label className="block text-sm font-medium text-slate-700">Work email<input name="email" type="email" required className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="researcher@example.org" /></label><Button className="mt-4 w-full" disabled={loading}>{loading ? "Sending secure link…" : "Email me a sign-in link"}</Button>{message && <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm leading-5 text-slate-700" aria-live="polite">{message}</p>}</form>;
}
