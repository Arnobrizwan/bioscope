import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/location-intelligence/route";

describe("GET /api/location-intelligence", () => {
  it("returns the application error envelope for invalid latitude", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/location-intelligence?lat=91&lng=102&radius=25",
      ),
    );
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("Latitude");
  });

  it("returns the application error envelope for invalid radius", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/location-intelligence?lat=4&lng=102&radius=12",
      ),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });
});
