import { describe, expect, it } from "vitest";
import { observationInputSchema } from "@/schemas/observation.schema";

const valid = { speciesName: "Black hornbill", scientificName: "Anthracoceros malayanus", latitude: 4.2, longitude: 102, observedAt: "2026-08-10T10:00:00+06:00", count: 1, isPublic: false };

describe("observation input validation", () => {
  it("accepts a valid observation", () => { expect(observationInputSchema.parse(valid).speciesName).toBe("Black hornbill"); });
  it.each([{ ...valid, count: 0 }, { ...valid, latitude: -100 }, { ...valid, speciesName: "x" }, { ...valid, observedAt: "yesterday" }])("rejects invalid form input %#", (input) => { expect(() => observationInputSchema.parse(input)).toThrow(); });
});
