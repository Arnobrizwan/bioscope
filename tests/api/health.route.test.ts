import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns a non-cacheable service health response", async () => {
    const response = GET();
    const body = (await response.json()) as { status: string; service: string };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ status: "ok", service: "bioscope" });
  });
});
