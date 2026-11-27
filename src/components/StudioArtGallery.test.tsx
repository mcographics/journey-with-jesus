import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StudioArtGallery } from "@/components/StudioArtGallery";

type GalleryRow = Database["public"]["Tables"]["art_gallery_images"]["Row"];
type SettingsRow = Database["public"]["Tables"]["art_gallery_settings"]["Row"];

const existingImage: GalleryRow = {
  id: "art-1",
  title: "Peter in the courtyard",
  description: "A test gallery image.",
  category: "Artwork",
  storage_path: "artwork/original-image.webp",
  width: 1400,
  height: 900,
  published: true,
  sort_order: 0,
  created_at: "2026-11-27T12:00:00.000Z",
  updated_at: "2026-11-27T12:00:00.000Z",
  created_by: "admin-1",
};

const settings: SettingsRow = {
  id: "default",
  watermark_logo_path: "/images/kerygma-path-logo.png",
  watermark_position: "bottom-right",
  watermark_opacity: 0.78,
  watermark_scale: 0.18,
  updated_at: "2026-11-27T12:00:00.000Z",
};

function createClient() {
  let savedCategory = existingImage.category;
  const update = vi.fn((values: { category: string }) => ({
    eq: vi.fn((_column: string, _id: string) => ({
      select: vi.fn(() => ({
        maybeSingle: async () => {
          savedCategory = values.category;
          return { data: { id: existingImage.id }, error: null };
        },
      })),
    })),
  }));
  const imageQuery = {
    select: vi.fn(),
    order: vi.fn(),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve({ data: [{ ...existingImage, category: savedCategory }], error: null }).then(resolve, reject),
  };
  imageQuery.select.mockReturnValue(imageQuery);
  imageQuery.order.mockReturnValue(imageQuery);

  const client = {
    from: vi.fn((table: string) => table === "art_gallery_settings"
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: settings, error: null }) }) }) }
      : { select: () => imageQuery, update }),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: async () => ({ data: { signedUrl: "https://gallery.example.test/artwork/original-image.webp" }, error: null }),
        upload: vi.fn(),
      })),
    },
  } as unknown as SupabaseClient<Database>;
  return { client, update };
}

describe("StudioArtGallery category editor", () => {
  it("requires a category on new uploads", async () => {
    const user = userEvent.setup();
    const { client } = createClient();
    render(<StudioArtGallery client={client} />);

    const category = await screen.findByLabelText("Category");
    expect(category).toHaveProperty("required", true);
    expect((category as HTMLSelectElement).value).toBe("");
    expect(screen.getByRole("option", { name: "Characters" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Scenery & Locations" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Scenes & Moments" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Props & Details" })).toBeTruthy();
  });

  it("reassigns a legacy image without touching its file or published state", async () => {
    const user = userEvent.setup();
    const { client, update } = createClient();
    render(<StudioArtGallery client={client} />);

    await screen.findByText("Peter in the courtyard");
    await user.click(screen.getByRole("button", { name: "Change category for Peter in the courtyard" }));
    const category = screen.getByLabelText("Category for Peter in the courtyard");
    await user.selectOptions(category, "Scenes & Moments");
    await user.click(screen.getByRole("button", { name: "Save category for Peter in the courtyard" }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({ category: "Scenes & Moments" }));
    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Scenes & Moments · Published")).toBeTruthy();
    expect(screen.getByText("Category updated. The stored image and publication status were left unchanged.")).toBeTruthy();
  });
});
