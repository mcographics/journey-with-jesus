"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, UploadCloud, Users } from "lucide-react";
import Image from "next/image";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createStorageObjectId } from "@/lib/storage-object-id";

type CharacterRow = Database["public"]["Tables"]["media_characters"]["Row"];
type Props = {
  client: SupabaseClient<Database>;
  onNotice: (message: string, isError?: boolean) => void;
};
type CharacterForm = {
  name: string;
  role: string;
  summary: string;
  scripture_references: string;
  portrait_url: string;
  sort_order: string;
  published: boolean;
};
const blankForm = (): CharacterForm => ({
  name: "", role: "", summary: "", scripture_references: "",
  portrait_url: "", sort_order: "0", published: false,
});

export function StudioCharacters({ client, onNotice }: Props) {
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterForm>(blankForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const portraitInput = useRef<HTMLInputElement>(null);
  const [removePortrait, setRemovePortrait] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCharacters = useCallback(async () => {
    try {
      const { data, error } = await client.from("media_characters").select("*").order("sort_order");
      if (error) throw error;
      setCharacters(data ?? []);
      return true;
    } catch (error) {
      onNotice("Character list could not be refreshed: " + errorMessage(error), true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, onNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCharacters(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCharacters]);

  function editCharacter(character: CharacterRow) {
    setSelectedId(character.id);
    setForm({
      name: character.name,
      role: character.role,
      summary: character.summary,
      scripture_references: character.scripture_references,
      portrait_url: character.portrait_url ?? "",
      sort_order: String(character.sort_order),
      published: character.published,
    });
    setImageFile(null);
    if (portraitInput.current) portraitInput.current.value = "";
    setRemovePortrait(false);
  }

  function startNewCharacter() {
    setSelectedId(null);
    setForm(blankForm());
    setImageFile(null);
    if (portraitInput.current) portraitInput.current.value = "";
    setRemovePortrait(false);
  }

  async function saveCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const id = selectedId ?? slugify(name);
    if (!name || !id) {
      onNotice("Add a character name so Upper Room can create a record ID.", true);
      return;
    }
    if (imageFile && (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(imageFile.type) || imageFile.size > 10 * 1024 * 1024)) {
      onNotice("Choose a JPEG, PNG, WebP, or AVIF image up to 10 MB.", true);
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let portraitUrl = removePortrait ? null : (form.portrait_url || null);
      if (imageFile) {
        const extensionByType: Record<string, string> = {
          "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
        };
        const path = id + "/" + createStorageObjectId() + "." + extensionByType[imageFile.type];
        const { data: uploaded, error: uploadError } = await client.storage
          .from("character-portraits")
          .upload(path, imageFile, { cacheControl: "3600", contentType: imageFile.type, upsert: false });
        if (uploadError || !uploaded) {
          throw new Error("Portrait upload failed: " + (uploadError?.message ?? "unknown upload error"));
        }
        uploadedPath = uploaded.path;
        portraitUrl = client.storage.from("character-portraits").getPublicUrl(uploaded.path).data.publicUrl;
      }

      const savedValues = {
        name,
        role: form.role.trim(),
        summary: form.summary.trim(),
        scripture_references: form.scripture_references.trim(),
        portrait_url: portraitUrl,
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        published: form.published,
      };
      if (selectedId) {
        const { data, error } = await client.from("media_characters").update(savedValues).eq("id", selectedId).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Character details were not saved. Reload the list and try again.");
      } else {
        const { data, error } = await client.from("media_characters").insert({ id, ...savedValues }).select("id").single();
        if (error) throw error;
        if (!data) throw new Error("Character details could not be saved.");
      }

      const uploadedPortrait = Boolean(imageFile);
      uploadedPath = null;
      setSelectedId(id);
      setForm((current) => ({ ...current, portrait_url: portraitUrl ?? "" }));
      setImageFile(null);
      if (portraitInput.current) portraitInput.current.value = "";
      setRemovePortrait(false);
      if (await loadCharacters()) {
        onNotice(uploadedPortrait ? "Character and portrait saved in Upper Room." : "Character details saved in Upper Room.", false);
      }
    } catch (error) {
      if (uploadedPath) {
        try { await client.storage.from("character-portraits").remove([uploadedPath]); } catch { /* Keep the original save error visible. */ }
      }
      onNotice(errorMessage(error), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="studio-content-grid studio-characters-grid">
      <section className="studio-panel studio-library">
        <div className="studio-panel-heading">
          <div><h2>Meet the Characters</h2><p>Edit the public dossiers and portrait images.</p></div>
          <button type="button" className="studio-small-button" onClick={startNewCharacter}><Plus size={15} />New</button>
        </div>
        {loading ? <p className="studio-empty"><LoaderCircle className="studio-spin" size={15} /> Loading characters…</p> :
          characters.length === 0 ? <p className="studio-empty">No characters yet. Add one to get started.</p> :
            characters.map((character) => (
              <button key={character.id} type="button" className={"studio-list-item" + (selectedId === character.id ? " is-selected" : "")} onClick={() => editCharacter(character)}>
                <span className="studio-character-list-copy">
                  {character.portrait_url && <Image src={character.portrait_url} alt="" width={88} height={104} unoptimized />}
                  <span><strong>{character.name}</strong><small>{character.published ? "Published" : "Draft"} · {character.role || "No role added"}</small></span>
                </span>
                <span className={"studio-status" + (character.published ? " is-live" : "")}>{character.published ? "LIVE" : "DRAFT"}</span>
              </button>
            ))}
      </section>

      <form className="studio-panel studio-form" onSubmit={(event) => void saveCharacter(event)}>
        <div className="studio-panel-heading">
          <div><h2>{selectedId ? "Edit character" : "New character"}</h2><p>Changes appear publicly when this dossier is published.</p></div>
          <Users size={20} />
        </div>
        <div className="studio-character-fields">
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={160} required /></label>
          <label>Role or description<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} maxLength={240} /></label>
          <label className="studio-span-two">Biography<textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} maxLength={3000} rows={5} /></label>
          <label className="studio-span-two">Bible references<input value={form.scripture_references} onChange={(event) => setForm({ ...form, scripture_references: event.target.value })} maxLength={500} placeholder="e.g. Luke 1–2 · John 2" /></label>
          <label>Display order<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} /></label>
          <label className="studio-check"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />Publish on the public page</label>
          <label className="studio-span-two studio-upload-field"><span>Portrait image</span><input ref={portraitInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemovePortrait(false); }} /><small>{imageFile?.name ?? (form.portrait_url ? "A portrait is saved. Choose a new image to replace it." : "No portrait uploaded.")}</small></label>
        </div>
        {(form.portrait_url || removePortrait) && (
          <div className="studio-character-preview">
            {!removePortrait && form.portrait_url && <Image src={form.portrait_url} alt={form.name ? "Portrait of " + form.name : "Current character portrait"} width={144} height={176} unoptimized />}
            {removePortrait ? <span>The saved portrait will be removed when you save.</span> : <button type="button" onClick={() => { setRemovePortrait(true); setImageFile(null); }}>Remove portrait</button>}
          </div>
        )}
        <button className="button button-gold" type="submit" disabled={saving || loading}><Check size={16} />{saving ? "Saving…" : "Save character"}</button>
        {imageFile && <p className="studio-file-hint"><UploadCloud size={14} /> Portrait uploads when you save this character.</p>}
      </form>
    </div>
  );
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Character could not be saved.";
}
