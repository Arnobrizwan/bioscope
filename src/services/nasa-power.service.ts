import { subDays, format } from "date-fns";
import { fetchJson } from "@/lib/fetch-with-timeout";
import type { EnvironmentalSnapshot, LocationCoordinates } from "@/types/domain";

const NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const PARAMETERS = "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN";

type NasaSeries = Record<string, number>;
export interface NasaPowerResponse {
  properties?: {
    parameter?: Partial<Record<"T2M" | "PRECTOTCORR" | "RH2M" | "ALLSKY_SFC_SW_DWN", NasaSeries>>;
  };
}

function validValues(series?: NasaSeries): number[] {
  return Object.values(series ?? {}).filter((value) => Number.isFinite(value) && value > -900);
}

function average(series?: NasaSeries): number | undefined {
  const values = validValues(series);
  if (!values.length) return undefined;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

export function normalizeNasaPowerResponse(
  response: NasaPowerResponse,
  period: { start: string; end: string },
): EnvironmentalSnapshot {
  const parameters = response.properties?.parameter;
  return {
    temperature: average(parameters?.T2M),
    precipitation: average(parameters?.PRECTOTCORR),
    humidity: average(parameters?.RH2M),
    solarRadiation: average(parameters?.ALLSKY_SFC_SW_DWN),
    period,
    units: {
      temperature: "°C",
      precipitation: "mm/day",
      humidity: "%",
      solarRadiation: "kWh/m²/day",
    },
  };
}

export async function getEnvironmentalSnapshot(location: LocationCoordinates) {
  // POWER daily products are finalized with a lag, so query a recent completed 30-day window.
  const endDate = subDays(new Date(), 7);
  const startDate = subDays(endDate, 29);
  const period = { start: format(startDate, "yyyyMMdd"), end: format(endDate, "yyyyMMdd") };
  const url = new URL(NASA_POWER_URL);
  url.searchParams.set("parameters", PARAMETERS);
  url.searchParams.set("community", "AG");
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("start", period.start);
  url.searchParams.set("end", period.end);
  url.searchParams.set("format", "JSON");

  const response = await fetchJson<NasaPowerResponse>(url, "NASA POWER", {
    timeoutMs: 10_000,
    next: { revalidate: 21_600 },
  });
  return normalizeNasaPowerResponse(response, period);
}
