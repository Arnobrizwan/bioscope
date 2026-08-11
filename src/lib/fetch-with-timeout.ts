import { ExternalServiceError } from "@/lib/errors";

export async function fetchJson<T>(
  url: URL | string,
  provider: string,
  init: RequestInit & { timeoutMs?: number; attempts?: number } = {},
): Promise<T> {
  const { timeoutMs = 8_000, attempts = 2, ...requestInit } = init;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: "application/json", ...requestInit.headers },
      });

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === attempts)
          throw new ExternalServiceError(provider);
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      if (attempt === attempts) throw new ExternalServiceError(provider);
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
  }

  throw new ExternalServiceError(provider);
}
