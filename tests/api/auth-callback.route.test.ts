import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, exchangeCodeForSession } = vi.hoisted(
  () => ({
    createSupabaseServerClient: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  }),
);
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });
  });

  it("redirects a successful exchange to an allowed internal path", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://bioscope.example/auth/callback?code=valid&next=/observations",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://bioscope.example/observations",
    );
  });

  it("prevents protocol-relative redirect targets", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://bioscope.example/auth/callback?code=valid&next=//malicious.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://bioscope.example/dashboard",
    );
  });

  it("returns to login when the exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("expired") });

    const response = await GET(
      new Request("https://bioscope.example/auth/callback?code=expired"),
    );

    expect(response.headers.get("location")).toBe(
      "https://bioscope.example/login?error=authentication",
    );
  });
});
