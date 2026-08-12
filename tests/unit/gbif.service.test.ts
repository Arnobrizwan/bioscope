import { afterEach, describe, expect, it, vi } from "vitest";
import { getGeoreferencedOccurrenceCountByTaxon } from "@/services/gbif.service";

describe("GBIF species occurrence counts", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests only the georeferenced count without downloading records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 5_497, results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getGeoreferencedOccurrenceCountByTaxon(5_219_416),
    ).resolves.toBe(5_497);

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("taxon_key")).toBe("5219416");
    expect(requestUrl.searchParams.get("has_coordinate")).toBe("true");
    expect(requestUrl.searchParams.get("limit")).toBe("0");
  });
});
