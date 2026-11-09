import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommentSection } from "@/components/CommentSection";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(async () => ({ data: { status: "pending" }, error: null })),
  approvedComments: [] as Array<{
    id: string; episode_id: string; display_name: string; body: string;
    status: "approved"; created_at: string;
  }>,
}));
vi.mock("@/lib/supabase/browser", () => ({
  isSupabaseConfigured: () => true,
  createBrowserSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: mocks.approvedComments, error: null }),
            }),
          }),
        }),
      }),
    }),
    functions: { invoke: mocks.invoke },
  }),
}));
beforeEach(() => {
  mocks.invoke.mockClear();
  mocks.approvedComments = [];
});

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

describe("video-style media comments", () => {
  it("shows approved comments with avatars and sorts them in either direction", async () => {
    mocks.approvedComments = [
      { id: "new", episode_id: "episode-1", display_name: "Charlie",
        body: "The newer reflection", status: "approved", created_at: "2026-11-08T12:00:00Z" },
      { id: "old", episode_id: "episode-1", display_name: "Alex",
        body: "The older reflection", status: "approved", created_at: "2026-11-01T12:00:00Z" },
    ];
    const { container } = render(<CommentSection episode={{
      id: "episode-1", title: "Faith", description: "", published: true, episodeNumber: 1,
    }} />);
    expect(await screen.findByText("The newer reflection")).toBeTruthy();
    expect(screen.getByText("2 comments")).toBeTruthy();
    const authors = () => Array.from(container.querySelectorAll(".comment-byline strong")).map((el) => el.textContent);
    expect(authors()).toEqual(["Charlie", "Alex"]);
    expect(container.querySelectorAll(".comment-avatar")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Sort comments"), { target: { value: "oldest" } });
    expect(authors()).toEqual(["Alex", "Charlie"]);
  });

  it("cancels a draft without sending it for moderation", () => {
    render(<CommentSection episode={null} general />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Sam" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Your reflection/ }), { target: { value: "My draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("textbox", { name: /Your reflection/ }) as HTMLTextAreaElement).value).toBe("");
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
