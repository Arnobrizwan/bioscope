import { describe, expect, it } from "vitest";
import { normalizeGbifOccurrence } from "@/services/gbif.service";
import { normalizeNasaPowerResponse } from "@/services/nasa-power.service";

describe("provider adapters", () => {
  it("safely rejects unmappable GBIF records", () => { expect(normalizeGbifOccurrence({ key: 1, scientificName: "Taxon" })).toBeNull(); });
  it("normalizes a complete GBIF record", () => { expect(normalizeGbifOccurrence({ key: 1, scientificName: "Taxon", class: "Aves", decimalLatitude: 4, decimalLongitude: 102 })?.taxonomicGroup).toBe("birds"); });
  it("averages NASA series and discards fill values", () => { const result = normalizeNasaPowerResponse({ properties: { parameter: { T2M: { a: 28, b: 30, c: -999 }, RH2M: { a: 80, b: 82 } } } }, { start: "a", end: "b" }); expect(result.temperature).toBe(29); expect(result.humidity).toBe(81); expect(result.precipitation).toBeUndefined(); });
});
