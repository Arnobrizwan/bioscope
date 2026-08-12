import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/intelligence/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const authenticationFailed = (await searchParams).error === "authentication";

  return (
    <main className="grid flex-1 place-items-center px-5 py-14">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
          <ShieldCheck />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Researcher sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Passwordless authentication through Supabase protects observations and
          field briefs.
        </p>
        {authenticationFailed && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800"
          >
            That sign-in link is invalid or expired. Request a new secure link
            below.
          </p>
        )}
        <LoginForm />
        <p className="mt-5 text-xs leading-5 text-slate-400">
          BioScope never accepts a browser-provided user ID; identity is
          resolved from the verified server session.
        </p>
      </div>
    </main>
  );
}
