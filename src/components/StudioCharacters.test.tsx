import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StudioCharacters } from "@/components/StudioCharacters";

type CharacterRow = Database["public"]["Tables"]["media_characters"]["Row"];

function createClient(initialCharacters: CharacterRow[] = []) {
  const order = vi.fn().mockResolvedValue({ data: initialCharacters, error: null });
  const insert = vi.fn((values: { id: string }) => ({
    select: () => ({ single: async () => ({ data: { id: values.id }, error: null }) }),
  }));
  const update = vi.fn(() => ({
    eq: (_column: string, id: string) => ({
      select: () => ({ maybeSingle: async () => ({ data: { id }, error: null }) }),
    }),
  }));
  const upload = vi.fn().mockResolvedValue({ data: { path: "david/portrait-id.webp" }, error: null });
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: "https://storage.example.test/david/portrait-id.webp" } }));
  const storageBucket = { upload, getPublicUrl, remove: vi.fn() };
  const client = {
    from: vi.fn(() => ({
      select: () => ({ order }),
      insert,
      update,
    })),
    storage: { from: vi.fn(() => storageBucket) },
  } as unknown as SupabaseClient<Database>;

  return { client, insert, order, update, upload, getPublicUrl };
}

describe("Studio character editor", () => {
  it("uploads a portrait and saves its public image path with a new character", async () => {
    const user = userEvent.setup();
    const { client, insert, upload } = createClient();
    const onNotice = vi.fn();
    render(<StudioCharacters client={client} onNotice={onNotice} />);

    await screen.findByText("No characters yet. Add one to get started.");
    await user.type(screen.getByLabelText("Name"), "David");
    const file = new File(["portrait bytes"], "david.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("Portrait image"), file);
    await user.click(screen.getByRole("button", { name: "Save character and portrait" }));

    await waitFor(() => expect(insert).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^david\/.+\.webp$/),
      file,
      expect.objectContaining({ contentType: "image/webp", upsert: false }),
    );
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: "david",
      name: "David",
      portrait_url: "https://storage.example.test/david/portrait-id.webp",
    }));
    expect(onNotice).toHaveBeenCalledWith("Character and portrait saved in Upper Room.", false);
  });

  it("rejects an empty portrait before upload or save", async () => {
    const user = userEvent.setup();
    const { client, insert, upload } = createClient();
    const onNotice = vi.fn();
    render(<StudioCharacters client={client} onNotice={onNotice} />);

    await screen.findByText("No characters yet. Add one to get started.");
    await user.type(screen.getByLabelText("Name"), "David");
    await user.upload(screen.getByLabelText("Portrait image"), new File([], "empty.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "Save character and portrait" }));

    expect(onNotice).toHaveBeenCalledWith("The selected image file is empty.", true);
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("replaces a character portrait while updating the existing dossier", async () => {
    const user = userEvent.setup();
    const existing: CharacterRow = {
      id: "david",
      name: "David",
      role: "Shepherd",
      summary: "A shepherd chosen by God.",
      scripture_references: "1 Samuel 16–17",
      portrait_url: "https://storage.example.test/david/old.webp",
      sort_order: 6,
      published: true,
      created_at: "2026-11-17T00:00:00.000Z",
      updated_at: "2026-11-17T00:00:00.000Z",
    };
    const { client, update, upload } = createClient([existing]);
    const onNotice = vi.fn();
    render(<StudioCharacters client={client} onNotice={onNotice} />);

    await user.click(await screen.findByRole("button", { name: /David/ }));
    await user.clear(screen.getByLabelText("Role or description"));
    await user.type(screen.getByLabelText("Role or description"), "King of Israel");
    const file = new File(["replacement portrait"], "david-revised.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Portrait image"), file);
    await user.click(screen.getByRole("button", { name: "Save character and portrait" }));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^david\/.+\.png$/),
      file,
      expect.objectContaining({ contentType: "image/png", upsert: false }),
    );
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      role: "King of Israel",
      portrait_url: "https://storage.example.test/david/portrait-id.webp",
    }));
    expect(onNotice).toHaveBeenCalledWith("Character and portrait saved in Upper Room.", false);
  });
});
