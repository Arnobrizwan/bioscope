import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/lib/fetch-with-timeout";

describe("fetchJson", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries a transient provider failure once", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ records: 12 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson<{ records: number }>("https://provider.test", "Provider")).resolves.toEqual({
      records: 12,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent client error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("https://provider.test", "Provider")).rejects.toThrow(
      "Provider is temporarily unavailable",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
