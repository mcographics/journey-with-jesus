import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/database.types";
import { ArtGalleryExperience } from "@/components/ArtGalleryExperience";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: mocks.createClient,
}));

type GalleryRow = Database["public"]["Tables"]["art_gallery_images"]["Row"];

function row(id: string, title: string, category: string, published = true): GalleryRow {
  return {
    id,
    title,
    description: "A test gallery entry.",
    category,
    storage_path: "artwork/" + id + ".webp",
    width: 1200,
    height: 800,
    published,
    sort_order: 0,
    created_at: "2026-11-27T12:00:00.000Z",
    created_by: null,
  };
}

function makeClient(rows: GalleryRow[]) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(resolve, reject),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  const createSignedUrl = vi.fn(async (path: string) => ({
    data: { signedUrl: "https://gallery.example.test/" + path },
    error: null,
  }));
  const client = {
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
  };
  return { client, query, createSignedUrl };
}

describe("ArtGalleryExperience", () => {
  beforeEach(() => mocks.createClient.mockReset());

  it("starts with published category covers and opens each category as an artwork grid", async () => {
    const { client, query } = makeClient([
      row("peter", "Peter", "Characters"),
      row("parable", "The Good Samaritan", "Scenes & Moments"),
      row("legacy", "Legacy artwork", "Artwork"),
    ]);
    mocks.createClient.mockReturnValue(client);

    render(<ArtGalleryExperience />);

    await screen.findByRole("button", { name: "Characters" });
    expect(screen.getByRole("button", { name: "Scenes & Moments" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Other" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Scenery & Locations" })).toBeNull();
    expect(query.eq).toHaveBeenCalledWith("published", true);

    fireEvent.click(screen.getByRole("button", { name: "Characters" }));
    expect(screen.getByRole("heading", { name: "Characters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Peter" })).toBeTruthy();
    expect(screen.queryByText("Legacy artwork")).toBeNull();
  });

  it("keeps the existing carousel and image viewer available from a category grid", async () => {
    const { client } = makeClient([
      row("peter", "Peter", "Characters"),
      row("john", "John", "Characters"),
    ]);
    mocks.createClient.mockReturnValue(client);

    render(<ArtGalleryExperience />);

    fireEvent.click(await screen.findByRole("button", { name: "Characters" }));
    fireEvent.click(screen.getByRole("button", { name: "Open artwork: Peter" }));

    expect(screen.getByRole("button", { name: "Previous artwork" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next artwork" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View image" }));
    expect(screen.getByRole("dialog", { name: "Peter" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close artwork view" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("lets visitors change categories or return to the category overview", async () => {
    const { client } = makeClient([
      row("peter", "Peter", "Characters"),
      row("parable", "The Good Samaritan", "Scenes & Moments"),
    ]);
    mocks.createClient.mockReturnValue(client);

    render(<ArtGalleryExperience />);

    fireEvent.click(await screen.findByRole("button", { name: "Characters" }));
    fireEvent.click(screen.getByRole("button", { name: "Scenes & Moments" }));
    expect(screen.getByRole("heading", { name: "Scenes & Moments" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Browse categories" }));
    expect(screen.getByRole("heading", { name: "Browse categories" })).toBeTruthy();
  });
});
