import { describe, expect, it } from "vitest";
import { locationQuerySchema } from "@/schemas/location.schema";

describe("location query validation", () => {
  it("coerces valid query strings", () => {
    expect(
      locationQuerySchema.parse({ lat: "4.2", lng: "101.9", radius: "25" }),
    ).toEqual({ lat: 4.2, lng: 101.9, radius: 25 });
  });
  it.each([
    { lat: -91, lng: 0, radius: 25 },
    { lat: 0, lng: 181, radius: 25 },
    { lat: 0, lng: 0, radius: 12 },
  ])("rejects invalid coordinate or radius %#", (input) => {
    expect(() => locationQuerySchema.parse(input)).toThrow();
  });
});
