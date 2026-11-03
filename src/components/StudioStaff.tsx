"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, UploadCloud, Users } from "lucide-react";
import Image from "next/image";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createStorageObjectId } from "@/lib/storage-object-id";
import { formatStudioError, getImageUploadInfo, getPublicStoragePath } from "@/lib/supabase/studio-upload";

type StaffRow = Database["public"]["Tables"]["media_team_members"]["Row"];
type Props = {
  client: SupabaseClient<Database>;
  onNotice: (message: string, isError?: boolean) => void;
};
type StaffForm = {
  name: string;
  role: string;
  bio: string;
  profile_image_url: string;
  sort_order: string;
  published: boolean;
};

const blankForm = (): StaffForm => ({
  name: "", role: "", bio: "", profile_image_url: "", sort_order: "0", published: false,
});

export function StudioStaff({ client, onNotice }: Props) {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(blankForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const loadStaff = useCallback(async () => {
    try {
      const { data, error } = await client.from("media_team_members").select("*").order("sort_order").order("name");
      if (error) throw error;
      setStaff(data ?? []);
      return true;
    } catch (error) {
      onNotice("Staff list could not be refreshed: " + formatError(error), true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, onNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStaff(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStaff]);

  function editMember(member: StaffRow) {
    setSelectedId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio,
      profile_image_url: member.profile_image_url ?? "",
      sort_order: String(member.sort_order),
      published: member.published,
    });
    setImageFile(null);
    setRemoveImage(false);
    if (imageInput.current) imageInput.current.value = "";
  }

  function startNewMember() {
    setSelectedId(null);
    setForm(blankForm());
    setImageFile(null);
    setRemoveImage(false);
    if (imageInput.current) imageInput.current.value = "";
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const id = selectedId ?? slugify(name);
    if (!name || !id) {
      onNotice("Add a staff member name so Upper Room can create a record ID.", true);
      return;
    }

    let uploadInfo: ReturnType<typeof getImageUploadInfo> | null = null;
    if (imageFile) {
      try {
        uploadInfo = getImageUploadInfo(imageFile);
      } catch (error) {
        onNotice(formatError(error), true);
        return;
      }
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      const previousImageUrl = selectedId
        ? staff.find((member) => member.id === selectedId)?.profile_image_url ?? null
        : null;
      let profileImageUrl = removeImage ? null : (form.profile_image_url || null);

      if (imageFile && uploadInfo) {
        const path = id + "/" + createStorageObjectId() + "." + uploadInfo.extension;
        const { data: uploaded, error: uploadError } = await client.storage
          .from("team-portraits")
          .upload(path, imageFile, { cacheControl: "3600", contentType: uploadInfo.contentType, upsert: false });
        if (uploadError || !uploaded) {
          throw new Error("Profile image upload failed: " + (uploadError?.message ?? "Storage did not confirm the upload."));
        }
        uploadedPath = uploaded.path;
        profileImageUrl = client.storage.from("team-portraits").getPublicUrl(uploaded.path).data.publicUrl;
      }

      const savedValues = {
        name,
        role: form.role.trim(),
        bio: form.bio.trim(),
        profile_image_url: profileImageUrl,
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        published: form.published,
      };
      if (selectedId) {
        const { data, error } = await client.from("media_team_members").update(savedValues).eq("id", selectedId).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Staff details were not saved. Reload the list and try again.");
      } else {
        const { data, error } = await client.from("media_team_members").insert({ id, ...savedValues }).select("id").single();
        if (error) throw error;
        if (!data) throw new Error("Staff details could not be saved.");
      }

      uploadedPath = null;
      const previousImagePath = previousImageUrl ? getPublicStoragePath(previousImageUrl, "team-portraits") : null;
      let cleanupFailed = false;
      if (previousImagePath && (imageFile || removeImage)) {
        const { error } = await client.storage.from("team-portraits").remove([previousImagePath]);
        cleanupFailed = Boolean(error);
      }

      setSelectedId(id);
      setForm((current) => ({ ...current, profile_image_url: profileImageUrl ?? "" }));
      setImageFile(null);
      setRemoveImage(false);
      if (imageInput.current) imageInput.current.value = "";
      const refreshed = await loadStaff();
      const imageWasSaved = Boolean(imageFile);
      const message = imageWasSaved
        ? "Staff member and profile image saved."
        : "Staff member details saved.";
      const refreshNote = refreshed ? " Changes are live in Meet the Team if published." : " Reload Upper Room to confirm the saved details.";
      const cleanupNote = cleanupFailed ? " The previous image could not be removed from storage." : "";
      onNotice(message + refreshNote + cleanupNote, !refreshed);
    } catch (error) {
      if (uploadedPath) {
        try { await client.storage.from("team-portraits").remove([uploadedPath]); } catch { /* Keep the original save error visible. */ }
      }
      onNotice(formatError(error), true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="studio-content-grid studio-characters-grid">
      <section className="studio-panel studio-library">
        <div className="studio-panel-heading">
          <div><h2>Meet the Team</h2><p>Add and edit the people shown on the public team page.</p></div>
          <button type="button" className="studio-small-button" onClick={startNewMember}><Plus size={15} />New</button>
        </div>
        {loading ? <p className="studio-empty"><LoaderCircle className="studio-spin" size={15} /> Loading staff…</p> :
          staff.length === 0 ? <p className="studio-empty">No staff profiles yet. Add the first one here.</p> :
            staff.map((member) => (
              <button key={member.id} type="button" className={"studio-list-item" + (selectedId === member.id ? " is-selected" : "")} onClick={() => editMember(member)}>
                <span className="studio-character-list-copy">
                  {member.profile_image_url && <Image src={member.profile_image_url} alt="" width={88} height={104} unoptimized />}
                  <span><strong>{member.name}</strong><small>{member.published ? "Published" : "Draft"} · {member.role || "No role added"}</small></span>
                </span>
                <span className={"studio-status" + (member.published ? " is-live" : "")}>{member.published ? "LIVE" : "DRAFT"}</span>
              </button>
            ))}
      </section>

      <form className="studio-panel studio-form" onSubmit={(event) => void saveMember(event)}>
        <div className="studio-panel-heading">
          <div><h2>{selectedId ? "Edit staff member" : "Add staff member"}</h2><p>Published profiles appear on Meet the Team.</p></div>
          <Users size={20} />
        </div>
        <div className="studio-form-grid">
          <label className="studio-span-two">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={160} required /></label>
          <label className="studio-span-two">Role or title<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} maxLength={240} placeholder="e.g. Editor / Webmaster" /></label>
          <label className="studio-span-two">About<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={3000} rows={5} placeholder="A short introduction for the public team page." /></label>
          <label>Display order<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} /></label>
          <label className="studio-check"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />Publish on Meet the Team</label>
          <label className="studio-span-two studio-upload-field"><span>Profile image</span><input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemoveImage(false); }} /><small>{imageFile?.name ?? (form.profile_image_url ? "A profile image is saved. Choose another to replace it." : "JPEG, PNG, WebP, or AVIF · up to 10 MB")}</small></label>
        </div>
        {form.profile_image_url && (
          <div className="studio-character-preview">
            {!removeImage && <Image src={form.profile_image_url} alt={form.name ? "Profile of " + form.name : "Current profile image"} width={144} height={176} unoptimized />}
            {removeImage ? <span>The saved profile image will be removed when you save.</span> : <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); if (imageInput.current) imageInput.current.value = ""; }}>Remove profile image</button>}
          </div>
        )}
        <button className="button button-gold" type="submit" disabled={saving || loading}><Check size={16} />{saving ? "Saving…" : imageFile ? "Save staff member and image" : "Save staff member"}</button>
        {imageFile && <p className="studio-file-hint"><UploadCloud size={14} /> The profile image uploads as part of this save.</p>}
      </form>
    </div>
  );
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function formatError(error: unknown): string {
  return formatStudioError(error, "Staff profile could not be saved.");
}
