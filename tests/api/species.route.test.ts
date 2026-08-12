import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchSpecies } = vi.hoisted(() => ({
  searchSpecies: vi.fn(),
}));
vi.mock("@/services/gbif.service", () => ({ searchSpecies }));

import { GET } from "@/app/api/species/route";

describe("GET /api/species", () => {
  beforeEach(() => searchSpecies.mockReset());

  it("rejects a query shorter than two characters", async () => {
    const response = await GET(new Request("http://localhost/api/species?q=x"));

    expect(response.status).toBe(400);
    expect(searchSpecies).not.toHaveBeenCalled();
  });

  it("returns normalized GBIF species matches", async () => {
    searchSpecies.mockResolvedValue([
      {
        key: 5219416,
        scientificName: "Panthera tigris (Linnaeus, 1758)",
        canonicalName: "Panthera tigris",
        isBackbone: true,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/species?q=Panthera%20tigris"),
    );

    expect(response.status).toBe(200);
    expect(searchSpecies).toHaveBeenCalledWith("Panthera tigris");
    expect(await response.json()).toMatchObject({
      data: [{ key: 5219416, isBackbone: true }],
    });
  });
});
