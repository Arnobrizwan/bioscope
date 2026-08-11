import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchOccurrences } = vi.hoisted(() => ({
  searchOccurrences: vi.fn(),
}));
vi.mock("@/services/gbif.service", () => ({ searchOccurrences }));

import { GET } from "@/app/api/occurrences/route";

describe("GET /api/occurrences", () => {
  beforeEach(() => searchOccurrences.mockReset());

  it("validates coordinates before calling GBIF", async () => {
    const response = await GET(
      new Request("http://localhost/api/occurrences?lat=95&lng=102&radius=25"),
    );
    expect(response.status).toBe(400);
    expect(searchOccurrences).not.toHaveBeenCalled();
  });

  it("returns normalized GBIF occurrence reference data", async () => {
    searchOccurrences.mockResolvedValue({
      providerCount: 42,
      records: [
        {
          id: "1",
          scientificName: "Buceros rhinoceros",
          latitude: 4.6,
          longitude: 102.3,
          taxonomicGroup: "birds",
        },
      ],
    });
    const response = await GET(
      new Request(
        "http://localhost/api/occurrences?lat=4.6&lng=102.3&radius=25",
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        providerCount: 42,
        source: { provider: "GBIF" },
        occurrences: [{ scientificName: "Buceros rhinoceros" }],
      },
    });
  });
});
