import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSpeciesDetails, getGeoreferencedOccurrenceCountByTaxon } =
  vi.hoisted(() => ({
    getSpeciesDetails: vi.fn(),
    getGeoreferencedOccurrenceCountByTaxon: vi.fn(),
  }));
vi.mock("@/services/gbif.service", () => ({
  getSpeciesDetails,
  getGeoreferencedOccurrenceCountByTaxon,
}));

import { GET } from "@/app/api/species/[taxonKey]/route";

describe("GET /api/species/[taxonKey]", () => {
  beforeEach(() => {
    getSpeciesDetails.mockReset();
    getGeoreferencedOccurrenceCountByTaxon.mockReset();
  });

  it("rejects an invalid taxon key", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ taxonKey: "invalid" }),
    });

    expect(response.status).toBe(400);
    expect(getSpeciesDetails).not.toHaveBeenCalled();
  });

  it("labels the coordinate-filtered count explicitly", async () => {
    getSpeciesDetails.mockResolvedValue({
      key: 5219416,
      scientificName: "Panthera tigris (Linnaeus, 1758)",
    });
    getGeoreferencedOccurrenceCountByTaxon.mockResolvedValue(5_497);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ taxonKey: "5219416" }),
    });

    expect(response.status).toBe(200);
    expect(getGeoreferencedOccurrenceCountByTaxon).toHaveBeenCalledWith(
      5219416,
    );
    expect(await response.json()).toMatchObject({
      data: {
        species: { key: 5219416 },
        georeferencedOccurrenceCount: 5_497,
      },
    });
  });
});
