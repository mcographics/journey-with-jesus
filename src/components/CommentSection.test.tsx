import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentSection } from "@/components/CommentSection";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(async () => ({ data: { status: "pending" }, error: null })),
}));
vi.mock("@/lib/supabase/browser", () => ({
  isSupabaseConfigured: () => true,
  createBrowserSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }),
    functions: { invoke: mocks.invoke },
  }),
}));
beforeEach(() => mocks.invoke.mockClear());

describe("general Media comments", () => {
  it("offers the same anonymous moderated comment form without an episode", async () => {
    render(<CommentSection episode={null} general />);
    expect(screen.getByRole("heading", { name: "Media community" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Your reflection/ }), { target: { value: "Thank you for these stories!" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("submit-comment", {
      body: { episodeId: "media-community", displayName: "Alex", body: "Thank you for these stories!", website: "" },
    }));
    expect(await screen.findByText(/waiting for review/)).toBeTruthy();
  });
});
