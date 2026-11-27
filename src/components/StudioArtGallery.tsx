"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, ImagePlus, LoaderCircle, Save, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { formatStudioError, getImageUploadInfo } from "@/lib/supabase/studio-upload";
import styles from "./StudioArtGallery.module.css";

type GalleryRow = Database["public"]["Tables"]["art_gallery_images"]["Row"];
type SettingsRow = Database["public"]["Tables"]["art_gallery_settings"]["Row"];
type WatermarkSettings = Pick<SettingsRow, "watermark_logo_path" | "watermark_position" | "watermark_opacity" | "watermark_scale">;
type GalleryItem = GalleryRow & { previewUrl: string };
type Props = { client: SupabaseClient<Database> };

const GALLERY_BUCKET = "journey-art-gallery";
const DEFAULT_SETTINGS: WatermarkSettings = {
  watermark_logo_path: "/images/kerygma-path-logo.png",
  watermark_position: "bottom-right",
  watermark_opacity: 0.78,
  watermark_scale: 0.18,
};
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function StudioArtGallery({ client }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Artwork");
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const artworkInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async () => {
    try {
      const [settingsResult, imagesResult] = await Promise.all([
        client.from("art_gallery_settings").select("*").eq("id", "default").maybeSingle(),
        client.from("art_gallery_images").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      ]);
      if (settingsResult.error) throw settingsResult.error;
      if (imagesResult.error) throw imagesResult.error;
      if (settingsResult.data) {
        const { watermark_logo_path, watermark_position, watermark_opacity, watermark_scale } = settingsResult.data;
        setSettings({ watermark_logo_path, watermark_position, watermark_opacity, watermark_scale });
      }
      const signedItems = await Promise.all((imagesResult.data ?? []).map(async (item) => {
        const { data, error } = await client.storage.from(GALLERY_BUCKET).createSignedUrl(item.storage_path, 600);
        if (error || !data?.signedUrl) return null;
        return { ...item, previewUrl: data.signedUrl };
      }));
      setItems(signedItems.filter((item): item is GalleryItem => Boolean(item)));
    } catch (error) {
      setMessage(formatStudioError(error, "The gallery could not be loaded."));
      setMessageError(true);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { void loadGallery(); }, [loadGallery]);

  async function persistWatermarkSettings(): Promise<WatermarkSettings> {
    let logoPath = settings.watermark_logo_path;
    let newlyUploadedPath: string | null = null;

    if (logoFile) {
      getImageUploadInfo(logoFile);
      const encoded = await convertToWebp(logoFile, 1200);
      logoPath = "branding/" + crypto.randomUUID() + ".webp";
      const { error } = await client.storage.from(GALLERY_BUCKET).upload(logoPath, encoded.blob, {
        contentType: "image/webp",
        upsert: false,
      });
      if (error) throw error;
      newlyUploadedPath = logoPath;
    }

    const nextSettings = { ...settings, watermark_logo_path: logoPath };
    const { error } = await client.from("art_gallery_settings").upsert(
      { id: "default", ...nextSettings },
      { onConflict: "id" },
    );
    if (error) {
      if (newlyUploadedPath) await client.storage.from(GALLERY_BUCKET).remove([newlyUploadedPath]);
      throw error;
    }

    setSettings(nextSettings);
    setLogoFile(null);
    if (logoInput.current) logoInput.current.value = "";
    setSettingsDirty(false);
    return nextSettings;
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setMessage("");
    try {
      await persistWatermarkSettings();
      setMessage("Watermark settings saved. New uploads will use these settings.");
      setMessageError(false);
    } catch (error) {
      setMessage(formatStudioError(error, "Watermark settings could not be saved."));
      setMessageError(true);
    } finally {
      setSavingSettings(false);
    }
  }

  async function uploadArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!artworkFile) {
      setMessage("Choose an image to upload.");
      setMessageError(true);
      return;
    }
    if (!title.trim()) {
      setMessage("Add a title for this artwork.");
      setMessageError(true);
      return;
    }

    setUploading(true);
    setMessage("");
    let uploadedPath: string | null = null;
    try {
      getImageUploadInfo(artworkFile);
      const effectiveSettings = settingsDirty || logoFile
        ? await persistWatermarkSettings()
        : settings;
      const logoBitmap = await loadWatermarkLogo(effectiveSettings.watermark_logo_path, client);
      const watermarked = await watermarkArtwork(artworkFile, logoBitmap, effectiveSettings);
      logoBitmap.close();

      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Your Studio session has expired. Sign in again.");

      uploadedPath = "artwork/" + crypto.randomUUID() + ".webp";
      const { error: uploadError } = await client.storage.from(GALLERY_BUCKET).upload(uploadedPath, watermarked.blob, {
        contentType: "image/webp",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await client.from("art_gallery_images").insert({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || "Artwork",
        storage_path: uploadedPath,
        width: watermarked.width,
        height: watermarked.height,
        published: publishImmediately,
        created_by: userData.user.id,
      });
      if (insertError) throw insertError;

      setMessage(publishImmediately
        ? "Watermarked artwork uploaded and published to the gallery."
        : "Watermarked artwork uploaded as a draft.");
      setMessageError(false);
      setArtworkFile(null);
      setTitle("");
      setDescription("");
      setCategory("Artwork");
      if (artworkInput.current) artworkInput.current.value = "";
      await loadGallery();
    } catch (error) {
      if (uploadedPath) await client.storage.from(GALLERY_BUCKET).remove([uploadedPath]);
      setMessage(formatStudioError(error, "The artwork could not be uploaded."));
      setMessageError(true);
    } finally {
      setUploading(false);
    }
  }

  async function setPublished(item: GalleryItem, published: boolean) {
    try {
      const { error } = await client.from("art_gallery_images").update({ published }).eq("id", item.id);
      if (error) throw error;
      setMessage(published ? "Artwork published." : "Artwork hidden from the public gallery.");
      setMessageError(false);
      await loadGallery();
    } catch (error) {
      setMessage(formatStudioError(error, "The artwork status could not be changed."));
      setMessageError(true);
    }
  }

  async function deleteArtwork(item: GalleryItem) {
    if (!window.confirm("Permanently delete “" + item.title + "” from the gallery?")) return;
    try {
      const { error } = await client.from("art_gallery_images").delete().eq("id", item.id);
      if (error) throw error;
      const { error: storageError } = await client.storage.from(GALLERY_BUCKET).remove([item.storage_path]);
      await loadGallery();
      setMessage(storageError
        ? "The gallery record was removed, but its stored image could not be deleted."
        : "Artwork deleted from the gallery.");
      setMessageError(Boolean(storageError));
    } catch (error) {
      setMessage(formatStudioError(error, "The artwork could not be deleted."));
      setMessageError(true);
    }
  }

  return (
    <section className={styles.galleryManager} aria-label="Art Gallery management">
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}>JOURNEY WITH JESUS</p><h2>Art Gallery</h2><p>Upload and publish watermarked artwork for the public gallery.</p></div>
        <span className={styles.imageCount}>{items.length} {items.length === 1 ? "image" : "images"}</span>
      </div>

      {message && <p className={messageError ? styles.messageError : styles.message} role="status">{message}</p>}

      <section className={styles.panel} aria-labelledby="gallery-watermark-title">
        <header className={styles.panelHeading}>
          <span className={styles.panelIcon}><ShieldCheck size={20} aria-hidden="true" /></span>
          <div><h3 id="gallery-watermark-title">Permanent watermark</h3><p>Saved settings are applied automatically to every new gallery upload.</p></div>
        </header>
        <form className={styles.settingsForm} onSubmit={saveSettings}>
          <div className={styles.logoRow}>
            <div>
              <strong>Company logo</strong>
              <p>{logoFile ? "Selected: " + logoFile.name : settings.watermark_logo_path.startsWith("/") ? "Using the Kerygma Path site logo." : "A custom Kerygma Path logo is saved."}</p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => logoInput.current?.click()}>
              <ImagePlus size={16} aria-hidden="true" /> Choose logo
            </button>
            <input
              ref={logoInput}
              className={styles.hiddenInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) {
                  try { getImageUploadInfo(file); setLogoFile(file); setSettingsDirty(true); }
                  catch (error) { setMessage(formatStudioError(error, "Choose a valid image.")); setMessageError(true); }
                }
              }}
            />
          </div>
          <div className={styles.settingsGrid}>
            <label>Logo position
              <select value={settings.watermark_position} onChange={(event) => { setSettings({ ...settings, watermark_position: event.target.value as WatermarkSettings["watermark_position"] }); setSettingsDirty(true); }}>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
              </select>
            </label>
            <label>Logo size <span>{Math.round(settings.watermark_scale * 100)}%</span>
              <input type="range" min="8" max="34" step="1" value={Math.round(settings.watermark_scale * 100)} onChange={(event) => { setSettings({ ...settings, watermark_scale: Number(event.target.value) / 100 }); setSettingsDirty(true); }} />
            </label>
            <label>Logo opacity <span>{Math.round(settings.watermark_opacity * 100)}%</span>
              <input type="range" min="35" max="100" step="5" value={Math.round(settings.watermark_opacity * 100)} onChange={(event) => { setSettings({ ...settings, watermark_opacity: Number(event.target.value) / 100 }); setSettingsDirty(true); }} />
            </label>
          </div>
          <div className={styles.saveRow}>
            <p>These settings remain saved for future uploads. Existing gallery images keep their current watermark.</p>
            <button className={styles.primaryButton} type="submit" disabled={savingSettings || uploading}>
              {savingSettings ? <LoaderCircle className={styles.spinner} size={16} /> : <Save size={16} aria-hidden="true" />}
              {savingSettings ? "Saving…" : "Save permanent settings"}
            </button>
          </div>
        </form>
      </section>

      <div className={styles.columns}>
        <form className={[styles.panel, styles.uploadPanel].join(" ")} onSubmit={uploadArtwork}>
          <header className={styles.panelHeading}>
            <span className={styles.panelIcon}><UploadCloud size={20} aria-hidden="true" /></span>
            <div><h3>Upload artwork</h3><p>Images are resized, watermarked, and stored as WebP.</p></div>
          </header>
          <label className={styles.filePicker}>
            <input
              ref={artworkInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) {
                  try { getImageUploadInfo(file); setArtworkFile(file); }
                  catch (error) { setMessage(formatStudioError(error, "Choose a valid image.")); setMessageError(true); }
                }
              }}
            />
            <ImagePlus size={20} aria-hidden="true" />
            <strong>{artworkFile ? artworkFile.name : "Choose a gallery image"}</strong>
            <span>JPEG, PNG, WebP, or AVIF · up to 10 MB</span>
          </label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required /></label>
          <label>Caption<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} rows={3} /></label>
          <label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={60} /></label>
          <label className={styles.check}><input type="checkbox" checked={publishImmediately} onChange={(event) => setPublishImmediately(event.target.checked)} />Publish after upload</label>
          <button className={styles.primaryButton} type="submit" disabled={uploading || savingSettings || !artworkFile}>
            {uploading ? <LoaderCircle className={styles.spinner} size={16} /> : <Check size={16} aria-hidden="true" />}
            {uploading ? "Watermarking and uploading…" : "Upload to gallery"}
          </button>
        </form>

        <section className={[styles.panel, styles.libraryPanel].join(" ")} aria-labelledby="gallery-library-title">
          <header className={styles.panelHeading}>
            <span className={styles.panelIcon}><ImagePlus size={20} aria-hidden="true" /></span>
            <div><h3 id="gallery-library-title">Gallery library</h3><p>Publish a draft or hide an image without deleting it.</p></div>
            <button className={styles.refreshButton} onClick={() => void loadGallery()} type="button" aria-label="Refresh gallery"><LoaderCircle size={16} aria-hidden="true" /></button>
          </header>
          {loading ? <p className={styles.loading}><LoaderCircle className={styles.spinner} size={16} />Loading gallery…</p> : items.length === 0 ? <p className={styles.empty}>No artwork has been uploaded yet.</p> : (
            <div className={styles.items}>
              {items.map((item) => (
                <article className={styles.item} key={item.id}>
                  <img src={item.previewUrl} alt="" draggable={false} />
                  <div className={styles.itemInfo}>
                    <strong>{item.title}</strong>
                    <span>{item.category} · {item.published ? "Published" : "Draft"}</span>
                    <div className={styles.itemActions}>
                      <button type="button" onClick={() => void setPublished(item, !item.published)} aria-label={(item.published ? "Hide " : "Publish ") + item.title}>
                        {item.published ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                        {item.published ? "Hide" : "Publish"}
                      </button>
                      <button type="button" onClick={() => void deleteArtwork(item)} aria-label={"Delete " + item.title}>
                        <Trash2 size={15} aria-hidden="true" />Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

async function loadWatermarkLogo(path: string, client: SupabaseClient<Database>): Promise<ImageBitmap> {
  if (path.startsWith("/")) {
    const response = await fetch(BASE_PATH + path);
    if (!response.ok) throw new Error("The Kerygma Path logo could not be loaded.");
    return createImageBitmap(await response.blob());
  }
  const { data, error } = await client.storage.from(GALLERY_BUCKET).download(path);
  if (error || !data) throw error ?? new Error("The saved watermark logo could not be loaded.");
  return createImageBitmap(data);
}

async function convertToWebp(file: Blob, maxEdge: number): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("This browser could not prepare the image."); }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToWebp(canvas);
  return { blob, width, height };
}

async function watermarkArtwork(file: File, logo: ImageBitmap, settings: WatermarkSettings): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("This browser could not prepare the image."); }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const maxLogoWidth = width * settings.watermark_scale;
  const fit = Math.min(maxLogoWidth / logo.width, height * 0.25 / logo.height);
  const logoWidth = Math.max(1, logo.width * fit);
  const logoHeight = Math.max(1, logo.height * fit);
  const margin = Math.max(16, Math.round(Math.min(width, height) * 0.025));
  const left = settings.watermark_position.endsWith("left") ? margin : width - logoWidth - margin;
  const top = settings.watermark_position.startsWith("top") ? margin : height - logoHeight - margin;
  context.save();
  context.globalAlpha = settings.watermark_opacity;
  context.shadowColor = "rgba(0,0,0,.55)";
  context.shadowBlur = Math.max(4, width * 0.004);
  context.drawImage(logo, left, top, logoWidth, logoHeight);
  context.restore();

  return { blob: await canvasToWebp(canvas), width, height };
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The image could not be encoded as WebP."));
    }, "image/webp", 0.88);
  });
}
