"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { LocationCoordinates, OccurrenceRecord } from "@/types/domain";

const ObservationMap = dynamic(
  () => import("@/components/map/biodiversity-map"),
  { ssr: false },
);
const defaultLocation = { latitude: 4.2105, longitude: 101.9758 };
const REFERENCE_RADIUS_KM = 25;

interface OccurrenceResponse {
  data?: { occurrences: OccurrenceRecord[] };
  error?: { message: string };
}

export function ObservationForm({
  initialLocation = defaultLocation,
}: {
  initialLocation?: LocationCoordinates;
}) {
  const router = useRouter();
  const [location, setLocation] =
    useState<LocationCoordinates>(initialLocation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [referenceRecords, setReferenceRecords] = useState<OccurrenceRecord[]>(
    [],
  );
  const [referenceStatus, setReferenceStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setReferenceStatus("loading");
      try {
        const params = new URLSearchParams({
          lat: String(location.latitude),
          lng: String(location.longitude),
          radius: String(REFERENCE_RADIUS_KM),
        });
        const response = await fetch(`/api/occurrences?${params}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as OccurrenceResponse;
        if (!response.ok || !body.data) {
          throw new Error(
            body.error?.message || "GBIF occurrence data unavailable.",
          );
        }
        setReferenceRecords(body.data.occurrences);
        setReferenceStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setReferenceRecords([]);
        setReferenceStatus("error");
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [location]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const observedLocal = String(form.get("observedAt"));
    const payload = {
      speciesName: form.get("speciesName"),
      scientificName: form.get("scientificName"),
      latitude: location.latitude,
      longitude: location.longitude,
      observedAt: new Date(observedLocal).toISOString(),
      count: Number(form.get("count")),
      notes: form.get("notes"),
      evidenceUrl: form.get("evidenceUrl"),
      isPublic: form.get("isPublic") === "on",
    };
    try {
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(result.error?.message || "Unable to save observation.");
      router.push("/observations");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save observation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="speciesName" label="Species name" required />
          <Field name="scientificName" label="Scientific name" italic />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="observedAt"
            label="Observed at"
            type="datetime-local"
            required
          />
          <Field
            name="count"
            label="Count"
            type="number"
            min="1"
            defaultValue="1"
            required
          />
        </div>
        <div className="mt-4">
          <Field
            name="evidenceUrl"
            label="Evidence photo URL (optional)"
            type="url"
          />
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Notes
          <textarea
            name="notes"
            maxLength={2000}
            rows={5}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            name="isPublic"
            type="checkbox"
            className="size-4 accent-emerald-800"
          />{" "}
          Make this observation visible in nearby public results
        </label>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <Button className="mt-5" type="submit" disabled={saving}>
          {saving ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving…" : "Save observation"}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold">Observation location</p>
          <p className="text-xs text-slate-500">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} ·
            click map or drag marker
          </p>
          <p className="mt-1 text-xs text-slate-500" aria-live="polite">
            {referenceStatus === "ready"
              ? `${referenceRecords.length} nearby GBIF reference markers within ${REFERENCE_RADIUS_KM} km`
              : referenceStatus === "error"
                ? "GBIF reference markers are temporarily unavailable"
                : "Loading nearby GBIF reference markers…"}
          </p>
        </div>
        <ObservationMap
          selected={location}
          onSelect={setLocation}
          occurrences={referenceRecords}
          className="h-[540px] w-full"
        />
      </div>
    </form>
  );
}

function Field({
  label,
  italic,
  ...props
}: {
  label: string;
  italic?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        {...props}
        className={`mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 ${italic ? "italic" : ""}`}
      />
    </label>
  );
}
