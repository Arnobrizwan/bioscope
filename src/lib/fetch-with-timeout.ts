import { ExternalServiceError } from "@/lib/errors";

export async function fetchJson<T>(
  url: URL | string,
  provider: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 8_000, ...requestInit } = init;

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json", ...requestInit.headers },
    });

    if (!response.ok) {
      throw new ExternalServiceError(provider);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ExternalServiceError) throw error;
    throw new ExternalServiceError(provider);
  }
}
