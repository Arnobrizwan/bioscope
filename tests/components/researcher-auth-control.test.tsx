import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, onAuthStateChange, signOut, push, refresh, unsubscribe } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    unsubscribe: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser, onAuthStateChange, signOut },
  }),
}));

import { ResearcherAuthControl } from "@/components/layout/researcher-auth-control";

describe("ResearcherAuthControl", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    signOut.mockResolvedValue({ error: null });
  });

  it("shows the current researcher and signs them out", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          email: "researcher@example.org",
          user_metadata: {},
        },
      },
    });
    render(<ResearcherAuthControl />);

    expect(await screen.findByText("researcher@example.org")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("shows the sign-in link when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    render(<ResearcherAuthControl />);

    await waitFor(() => expect(getUser).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("link", { name: "Researcher sign in" }),
    ).toHaveAttribute("href", "/login");
  });
});
