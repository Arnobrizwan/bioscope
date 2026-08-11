import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/gbif.service", () => ({ searchOccurrences: vi.fn() }));
vi.mock("@/services/nasa-power.service", () => ({
  getEnvironmentalSnapshot: vi.fn(),
}));

import { searchOccurrences } from "@/services/gbif.service";
import { getEnvironmentalSnapshot } from "@/services/nasa-power.service";
import { getLocationIntelligence } from "@/services/location-intelligence.service";

const gbif = vi.mocked(searchOccurrences);
const nasa = vi.mocked(getEnvironmentalSnapshot);
describe("location intelligence aggregation", () => {
  beforeEach(() => {
    gbif.mockReset();
    nasa.mockReset();
  });
  it("preserves biodiversity when NASA fails", async () => {
    gbif.mockResolvedValue({
      providerCount: 1,
      records: [
        {
          id: "1",
          scientificName: "Aves test",
          latitude: 4,
          longitude: 102,
          taxonomicGroup: "birds",
        },
      ],
    });
    nasa.mockRejectedValue(new Error("timeout"));
    const result = await getLocationIntelligence({
      lat: 4,
      lng: 102,
      radius: 25,
    });
    expect(result.biodiversity.speciesCount).toBe(1);
    expect(result.metadata.biodiversityStatus).toBe("ok");
    expect(result.metadata.environmentStatus).toBe("unavailable");
  });
  it("preserves environmental context when GBIF fails", async () => {
    gbif.mockRejectedValue(new Error("timeout"));
    nasa.mockResolvedValue({
      period: { start: "1", end: "2" },
      units: {
        temperature: "°C",
        precipitation: "mm/day",
        humidity: "%",
        solarRadiation: "kWh/m²/day",
      },
      temperature: 29,
    });
    const result = await getLocationIntelligence({
      lat: 4,
      lng: 102,
      radius: 25,
    });
    expect(result.biodiversity.occurrenceCount).toBe(0);
    expect(result.environment?.temperature).toBe(29);
    expect(result.metadata.biodiversityStatus).toBe("unavailable");
  });
});
