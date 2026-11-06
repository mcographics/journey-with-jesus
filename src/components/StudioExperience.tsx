"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, Film, ListVideo, LoaderCircle, LockKeyhole, LogOut, Mail, MessageCircle, Plus, Trash2, UploadCloud, Users, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Database, VideoContentType, VideoQuality } from "@/lib/database.types";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { formatStudioError, getImageUploadInfo, getPublicStoragePath } from "@/lib/supabase/studio-upload";
import { uploadVideoResumable } from "@/lib/supabase/resumable-upload";
import { createStorageObjectId } from "@/lib/storage-object-id";
import { StudioCharacters } from "@/components/StudioCharacters";
import { StudioStaff } from "@/components/StudioStaff";
import { parseYouTubeId, youtubeWatchUrl } from "@/lib/youtube";
import { resolveStoryPublication } from "@/lib/studio-publishing";
import { formatStudioFileSize, freePlanVideoSizeError } from "@/lib/studio-video-size";

type SourceRow = Database["public"]["Tables"]["media_video_sources"]["Row"];
type EpisodeRow = Database["public"]["Tables"]["media_episodes"]["Row"];
type CaptionRow = Database["public"]["Tables"]["media_captions"]["Row"];
type PlaylistRow = Database["public"]["Tables"]["media_playlists"]["Row"];
type CommentRow = Database["public"]["Tables"]["episode_comments"]["Row"];
type StudioEpisode = EpisodeRow & { sources: SourceRow[]; captions: CaptionRow[] };
type EpisodeForm = {
  id: string; title: string; description: string; scripture: string; thumbnail: string; youtubeUrl: string; transcript: string; aslUrl: string;
  duration: string; number: string; orientation: "landscape" | "portrait"; published: boolean;
};
type PlaylistForm = { id: string; title: string; description: string; order: string; published: boolean; episodeIds: string[] };
type Section = "episodes" | "playlists" | "comments" | "characters" | "staff";
const qualities: VideoQuality[] = ["720p", "1080p", "4K"];
const freshEpisode = (): EpisodeForm => ({ id: "", title: "", description: "", scripture: "", thumbnail: "", youtubeUrl: "", transcript: "", aslUrl: "", duration: "", number: "1", orientation: "landscape", published: false });
const freshPlaylist = (): PlaylistForm => ({ id: "", title: "", description: "", order: "0", published: false, episodeIds: [] });

export function StudioExperience() {
  const [client, setClient] = useState<ReturnType<typeof createBrowserSupabaseClient>>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [section, setSection] = useState<Section>("episodes");
  const [episodes, setEpisodes] = useState<StudioEpisode[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentFilter, setCommentFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loadingData, setLoadingData] = useState(false);
  const [episodeForm, setEpisodeForm] = useState<EpisodeForm>(freshEpisode);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailFileInput = useRef<HTMLInputElement>(null);
  const [captionFile, setCaptionFile] = useState<File | null>(null);
  const captionFileInput = useRef<HTMLInputElement>(null);
  const [captionLanguage, setCaptionLanguage] = useState("en");
  const [captionLabel, setCaptionLabel] = useState("English");
  const [captionKind, setCaptionKind] = useState<"captions" | "subtitles">("captions");
  const [captionDefault, setCaptionDefault] = useState(true);
  const [captionBusy, setCaptionBusy] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [files, setFiles] = useState<Record<VideoQuality, File | null>>({ "720p": null, "1080p": null, "4K": null });
  const videoFileInputs = useRef<Partial<Record<VideoQuality, HTMLInputElement>>>({});
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadQuality, setUploadQuality] = useState<VideoQuality | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [busyEpisodeId, setBusyEpisodeId] = useState<string | null>(null);
  const [playlistForm, setPlaylistForm] = useState<PlaylistForm>(freshPlaylist);
  const reportStudioNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
  }, []);

  function clearVideoFileSelections() {
    setFiles({ "720p": null, "1080p": null, "4K": null });
    Object.values(videoFileInputs.current).forEach((input) => { if (input) input.value = ""; });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const callbackNotice = consumeAuthCallbackNotice();
      if (callbackNotice) {
        setNotice(callbackNotice);
        setNoticeError(true);
      }
      setClient(createBrowserSupabaseClient());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const verifyAdmin = async (nextSession: Session | null) => {
      setSession(nextSession);
      setIsAdmin(false);
      if (!nextSession) { if (active) setAuthLoading(false); return; }
      setAuthLoading(true);
      const { data, error } = await client.from("media_admins").select("user_id").eq("user_id", nextSession.user.id).maybeSingle();
      if (!active) return;
      setIsAdmin(!error && Boolean(data));
      setAuthLoading(false);
      if (error) { setNotice("Studio access could not be checked. Try signing in again."); setNoticeError(true); }
    };
    void client.auth.getSession().then(({ data, error }) => {
      if (active) {
        if (error) { setNotice(signInErrorMessage(error.code, error.message)); setNoticeError(true); }
        void verifyAdmin(data.session);
      }
    });
    const { data: authData } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAdmin(false);
      setAuthLoading(Boolean(nextSession));
      window.setTimeout(() => { void verifyAdmin(nextSession); }, 0);
    });
    return () => { active = false; authData.subscription.unsubscribe(); };
  }, [client]);

  const loadStudioData = useCallback(async () => {
    if (!client) return false;
    setLoadingData(true);
    try {
      const [episodeResult, sourceResult, captionResult, playlistResult, commentResult] = await Promise.all([
        client.from("media_episodes").select("*").order("episode_number"),
        client.from("media_video_sources").select("*"),
        client.from("media_captions").select("*"),
        client.from("media_playlists").select("*").order("sort_order"),
        client.from("episode_comments").select("id, episode_id, display_name, body, status, created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      if (episodeResult.error) throw episodeResult.error;
      if (sourceResult.error) throw sourceResult.error;
      if (captionResult.error) throw captionResult.error;
      if (playlistResult.error) throw playlistResult.error;
      if (commentResult.error) throw commentResult.error;
      const sourceRows = sourceResult.data ?? [];
      const captionRows = captionResult.data ?? [];
      setEpisodes((episodeResult.data ?? []).map((episode) => ({
        ...episode,
        sources: sourceRows.filter((source) => source.episode_id === episode.id),
        captions: captionRows.filter((caption) => caption.episode_id === episode.id),
      })));
      setPlaylists(playlistResult.data ?? []);
      setComments(commentResult.data ?? []);
      return true;
    } catch (error) {
      setNotice(errorMessage(error));
      setNoticeError(true);
      return false;
    } finally { setLoadingData(false); }
  }, [client]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => { void loadStudioData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [isAdmin, loadStudioData]);

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setSendingLink(true); setNotice(""); setNoticeError(false);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const redirectPath = basePath.replace(/\/$/, "") + "/studio/";
    const redirect = new URL(redirectPath, window.location.origin).toString();
    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirect, shouldCreateUser: false },
      });
      if (error) {
        setNotice(signInErrorMessage(error.code, error.message));
        setNoticeError(true);
      } else {
        setNotice("Sign-in link sent. Open it once in this same browser. If it fails, request a fresh link and use the newest email.");
      }
    } catch (error) {
      setNotice(signInErrorMessage(undefined, errorMessage(error)));
      setNoticeError(true);
    } finally {
      setSendingLink(false);
    }
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setIsAdmin(false); setSession(null); setNotice("You are signed out of Studio.");
  }

  function editEpisode(episode: StudioEpisode) {
    setSelectedEpisodeId(episode.id);
    setEpisodeForm({
      id: episode.id, title: episode.title, description: episode.description,
      scripture: episode.scripture_reference ?? "", thumbnail: episode.thumbnail_url ?? "", youtubeUrl: episode.youtube_id ? youtubeWatchUrl(episode.youtube_id) : "",
      transcript: episode.transcript_text ?? "", aslUrl: episode.asl_interpretation_url ?? "",
      duration: episode.duration_seconds === null ? "" : String(episode.duration_seconds),
      number: String(episode.episode_number), orientation: episode.orientation, published: episode.published,
    });
    setThumbnailFile(null);
    if (thumbnailFileInput.current) thumbnailFileInput.current.value = "";
    clearVideoFileSelections();
    setCaptionFile(null);
    if (captionFileInput.current) captionFileInput.current.value = "";
    setUploadStatus("");
  }

  function newEpisode() {
    setSelectedEpisodeId(""); setEpisodeForm(freshEpisode());
    setThumbnailFile(null);
    if (thumbnailFileInput.current) thumbnailFileInput.current.value = "";
    setCaptionFile(null);
    if (captionFileInput.current) captionFileInput.current.value = "";
    clearVideoFileSelections(); setUploadStatus("");
  }


  async function toggleEpisodeVisibility(episode: StudioEpisode) {
    if (!client || busyEpisodeId || savingEpisode || uploadQuality) return;
    if (!episode.published && !episode.youtube_id && episode.sources.length === 0) {
      setNotice("Add a YouTube link or upload a video before making this story public.");
      setNoticeError(true);
      return;
    }
    const nextPublished = !episode.published;
    setBusyEpisodeId(episode.id);
    try {
      const { data, error } = await client.from("media_episodes")
        .update({ published: nextPublished }).eq("id", episode.id)
        .select("id, published").single();
      if (error) throw error;
      if (!data || data.published !== nextPublished) throw new Error("Studio could not verify the visibility change.");
      setEpisodes((current) => current.map((item) => item.id === episode.id ? { ...item, published: nextPublished } : item));
      if (selectedEpisodeId === episode.id) {
        setEpisodeForm((current) => ({ ...current, published: nextPublished }));
      }
      setNotice(nextPublished
        ? '"' + episode.title + '" is public again.'
        : '"' + episode.title + '" is hidden from the public Media page. Its files and story details are preserved.');
      setNoticeError(false);
    } catch (error) {
      setNotice(formatStudioError(error, "Unable to update story visibility."));
      setNoticeError(true);
    } finally {
      setBusyEpisodeId(null);
    }
  }

  async function deleteEpisode(episode: StudioEpisode) {
    if (!client || busyEpisodeId || savingEpisode || uploadQuality) return;
    const confirmed = window.confirm(
      'Permanently delete "' + episode.title + '"? This removes the story, its playlist entries, comments, caption files, transcript, and uploaded media from Journey Studio. This cannot be undone. Videos hosted on YouTube will not be deleted.'
    );
    if (!confirmed) return;
    setBusyEpisodeId(episode.id);
    try {
      // Remove the database story first so a storage failure cannot leave a broken public item.
      const { data, error } = await client.from("media_episodes")
        .delete().eq("id", episode.id).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Studio did not confirm the story was deleted.");
      if (selectedEpisodeId === episode.id) newEpisode();
      setEpisodes((current) => current.filter((item) => item.id !== episode.id));
      setPlaylistItems((current) => current.filter((item) => item.episode_id !== episode.id));
      setPlaylistForm((current) => ({
        ...current, episodeIds: current.episodeIds.filter((id) => id !== episode.id),
      }));
      setComments((current) => current.filter((comment) => comment.episode_id !== episode.id));

      // Storage deletes are separate from DB cascades and must be performed explicitly.
      const videoPaths = episode.sources.map((source) => source.storage_path);
      const captionPaths = episode.captions.map((caption) => caption.storage_path);
      const thumbnailPath = episode.thumbnail_url
        ? getPublicStoragePath(episode.thumbnail_url, "media-thumbnails") : null;
      const cleanupProblems: string[] = [];
      if (videoPaths.length) {
        try {
          const { error: videoError } = await client.storage.from("media-videos").remove(videoPaths);
          if (videoError) cleanupProblems.push("uploaded video files");
        } catch { cleanupProblems.push("uploaded video files"); }
      }
      if (captionPaths.length) {
        try {
          const { error: captionError } = await client.storage.from("media-videos").remove(captionPaths);
          if (captionError) cleanupProblems.push("caption files");
        } catch { cleanupProblems.push("caption files"); }
      }
      if (thumbnailPath) {
        try {
          const { error: thumbnailError } = await client.storage.from("media-thumbnails").remove([thumbnailPath]);
          if (thumbnailError) cleanupProblems.push("thumbnail");
        } catch { cleanupProblems.push("thumbnail"); }
      }
      setNotice('Deleted "' + episode.title + '" from the library.' +
        (cleanupProblems.length ? " The " + cleanupProblems.join(" and ") +
          " could not be fully cleaned up in Supabase Storage; check the storage dashboard." : ""));
      setNoticeError(cleanupProblems.length > 0);
    } catch (error) {
      setNotice(formatStudioError(error, "Unable to delete this story."));
      setNoticeError(true);
    } finally {
      setBusyEpisodeId(null);
    }
  }

  async function saveEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || savingEpisode) return;
    const id = episodeForm.id.trim() || slugify(episodeForm.title);
    if (!id) { setNotice("Add a title so Studio can create a story ID."); setNoticeError(true); return; }
    const existing = episodes.find((episode) => episode.id === id);
    const youtubeId = parseYouTubeId(episodeForm.youtubeUrl);
    if (episodeForm.youtubeUrl.trim() && !youtubeId) {
      setNotice("Enter a valid YouTube video link (youtube.com or youtu.be)."); setNoticeError(true); return;
    }
    const aslUrl = episodeForm.aslUrl.trim();
    if (aslUrl) {
      try {
        if (new URL(aslUrl).protocol !== "https:") throw new Error("HTTPS required");
      } catch {
        setNotice("Enter a valid HTTPS link to the interpreter-produced ASL video."); setNoticeError(true); return;
      }
    }
    if (episodeForm.transcript.length > 100000) {
      setNotice("Keep the transcript under 100,000 characters."); setNoticeError(true); return;
    }
    // Saving a draft first gives the direct uploader a story ID to attach its file.
    const publication = resolveStoryPublication(episodeForm.published, Boolean(existing?.sources.length), youtubeId);
    setSavingEpisode(true);
    let uploadedThumbnailPath: string | null = null;
    try {
      let thumbnailUrl = episodeForm.thumbnail.trim() || null;
      if (thumbnailFile) {
        const { contentType, extension } = getImageUploadInfo(thumbnailFile);
        const path = id + "/" + createStorageObjectId() + "." + extension;
        const { data: uploaded, error: uploadError } = await client.storage
          .from("media-thumbnails")
          .upload(path, thumbnailFile, { cacheControl: "31536000", contentType, upsert: false });
        if (uploadError || !uploaded) {
          throw new Error("Thumbnail upload failed: " + formatStudioError(uploadError, "Storage did not return an uploaded image."));
        }
        uploadedThumbnailPath = uploaded.path;
        thumbnailUrl = client.storage.from("media-thumbnails").getPublicUrl(uploaded.path).data.publicUrl;
      }

      const payload = {
        id, title: episodeForm.title.trim(), description: episodeForm.description.trim(),
        scripture_reference: episodeForm.scripture.trim() || null,
        thumbnail_url: thumbnailUrl,
        youtube_id: youtubeId,
        transcript_text: episodeForm.transcript.trim() || null,
        asl_interpretation_url: aslUrl || null,
        duration_seconds: episodeForm.duration.trim() ? Number(episodeForm.duration) : null,
        episode_number: Number(episodeForm.number) || 1, orientation: episodeForm.orientation,
        published: publication.published,
      };
      const { data, error } = await client.from("media_episodes").upsert(payload).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Studio did not confirm that the story was saved.");

      const previousThumbnail = episodes.find((episode) => episode.id === id)?.thumbnail_url;
      const previousThumbnailPath = previousThumbnail && previousThumbnail !== thumbnailUrl
        ? getPublicStoragePath(previousThumbnail, "media-thumbnails")
        : null;
      uploadedThumbnailPath = null;
      setEpisodeForm((current) => ({ ...current, id, thumbnail: thumbnailUrl ?? "", published: publication.published }));
      setThumbnailFile(null);
      if (thumbnailFileInput.current) thumbnailFileInput.current.value = "";
      setSelectedEpisodeId(id);

      let cleanupNote = "";
      if (previousThumbnailPath) {
        const { error: cleanupError } = await client.storage.from("media-thumbnails").remove([previousThumbnailPath]);
        if (cleanupError) cleanupNote = " The previous thumbnail could not be removed.";
      }
      const refreshed = await loadStudioData();
      const savedMessage = publication.savedAsDraft
        ? "Story saved as a draft. Choose a video file below and click Upload selected versions. When it finishes, check Publish and save the story again."
        : youtubeId
          ? "YouTube link and story saved. No direct video file is required."
          : thumbnailFile ? "Story details and thumbnail saved." : "Story details saved.";
      setUploadStatus(publication.savedAsDraft ? "Story saved. Choose a video file and click Upload selected versions." : "");
      setNotice((refreshed ? savedMessage : savedMessage + " The library could not refresh; reload the page to see the latest list.") + cleanupNote);
      setNoticeError(!refreshed || Boolean(cleanupNote));
    } catch (error) {
      let cleanupNote = "";
      if (uploadedThumbnailPath) {
        try {
          const { error: cleanupError } = await client.storage.from("media-thumbnails").remove([uploadedThumbnailPath]);
          if (cleanupError) cleanupNote = " The incomplete thumbnail upload could not be removed.";
        } catch {
          cleanupNote = " The incomplete thumbnail upload could not be removed.";
        }
      }
      setNotice(formatStudioError(error, "Story details could not be saved.") + cleanupNote);
      setNoticeError(true);
    } finally {
      setSavingEpisode(false);
    }
  }

  async function uploadCaption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !selectedEpisodeId) {
      setNotice("Save the story details before attaching caption files."); setNoticeError(true); return;
    }
    if (!captionFile) {
      setNotice("Choose a WebVTT caption file first."); setNoticeError(true); return;
    }
    if (captionFile.size > 2 * 1024 * 1024) {
      setNotice("Caption files must be 2 MB or smaller."); setNoticeError(true); return;
    }
    const language = captionLanguage.trim();
    const label = captionLabel.trim();
    if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language)) {
      setNotice("Enter a valid language code such as en, fr, or fr-CA."); setNoticeError(true); return;
    }
    if (!label || label.length > 80) {
      setNotice("Add a caption label of up to 80 characters."); setNoticeError(true); return;
    }
    const existingTrack = episodes.find((episode) => episode.id === selectedEpisodeId)?.captions
      .find((caption) => caption.language.toLowerCase() === language.toLowerCase() && caption.kind === captionKind);
    if (existingTrack) {
      setNotice(`A ${captionKind} track for ${language} already exists. Remove it before uploading a replacement.`); setNoticeError(true); return;
    }
    let webVtt: string;
    try { webVtt = await captionFile.text(); }
    catch { setNotice("The selected caption file could not be read."); setNoticeError(true); return; }
    if (!/^\uFEFF?WEBVTT(?:[ \t].*)?(?:\r?\n|$)/.test(webVtt)
      || !/^\s*\d{2}:\d{2}(?::\d{2})?\.\d{3}\s+-->\s+\d{2}:\d{2}(?::\d{2})?\.\d{3}(?:\s|$)/m.test(webVtt)) {
      setNotice("This file must start with WEBVTT and contain at least one timed cue."); setNoticeError(true); return;
    }

    setCaptionBusy(true);
    let uploadedPath: string | null = null;
    try {
      const path = `${selectedEpisodeId}/captions/${createStorageObjectId()}.vtt`;
      const { data: uploaded, error: uploadError } = await client.storage.from("media-videos").upload(path, captionFile, {
        cacheControl: "3600", contentType: "text/vtt", upsert: false,
      });
      if (uploadError || !uploaded) throw new Error("Caption upload failed: " + formatStudioError(uploadError, "Storage did not return an uploaded file."));
      uploadedPath = uploaded.path;

      if (captionDefault) {
        const { error } = await client.from("media_captions").update({ is_default: false }).eq("episode_id", selectedEpisodeId).eq("is_default", true);
        if (error) throw error;
      }
      const { data, error } = await client.from("media_captions").insert({
        episode_id: selectedEpisodeId, language, label, kind: captionKind,
        storage_path: uploaded.path, is_default: captionDefault,
      }).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Studio did not confirm that the caption file was attached.");
      uploadedPath = null;
      setCaptionFile(null);
      if (captionFileInput.current) captionFileInput.current.value = "";
      const refreshed = await loadStudioData();
      setNotice(refreshed ? `The ${label} WebVTT track was attached.` : "The caption file was saved, but the library could not refresh. Reload Studio to confirm it.");
      setNoticeError(!refreshed);
    } catch (error) {
      let cleanupNote = "";
      if (uploadedPath) {
        const { error: cleanupError } = await client.storage.from("media-videos").remove([uploadedPath]);
        if (cleanupError) cleanupNote = " The unlinked upload could not be removed from storage.";
      }
      setNotice(formatStudioError(error, "Caption file could not be attached.") + cleanupNote);
      setNoticeError(true);
    } finally {
      setCaptionBusy(false);
    }
  }

  async function deleteCaption(caption: CaptionRow) {
    if (!client || captionBusy) return;
    const confirmed = window.confirm(`Remove the ${caption.label} caption track from this story?`);
    if (!confirmed) return;
    setCaptionBusy(true);
    try {
      const { data, error } = await client.from("media_captions").delete().eq("id", caption.id).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Studio did not confirm that the caption track was removed.");
      const { error: cleanupError } = await client.storage.from("media-videos").remove([caption.storage_path]);
      const refreshed = await loadStudioData();
      setNotice(cleanupError
        ? "The caption record was removed, but its stored file could not be deleted. Check Supabase Storage."
        : refreshed ? `The ${caption.label} caption track was removed.` : "The caption track was removed, but the library could not refresh.");
      setNoticeError(Boolean(cleanupError) || !refreshed);
    } catch (error) {
      setNotice(formatStudioError(error, "Caption track could not be removed."));
      setNoticeError(true);
    } finally {
      setCaptionBusy(false);
    }
  }

  async function uploadSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !selectedEpisodeId) { setUploadStatus("Save story details first to enable uploads. You can save a draft without a video, even with Publish checked."); setNoticeError(true); return; }
    const selectedFiles = qualities.flatMap((quality) => files[quality] ? [{ quality, file: files[quality]! }] : []);
    if (selectedFiles.length === 0) { setUploadStatus("Choose one or more video files first."); return; }
    const sizeError = selectedFiles.map(({ file }) => freePlanVideoSizeError(file)).find(Boolean);
    if (sizeError) {
      setUploadStatus(sizeError);
      setNoticeError(true);
      return;
    }
    setUploadStatus(""); setNoticeError(false);
    const completedQualities: VideoQuality[] = [];
    let pendingUploadPath: string | null = null;
    try {
      for (const item of selectedFiles) {
        const contentType = getVideoContentType(item.file);
        setUploadQuality(item.quality); setUploadProgress(0);
        const safeName = item.file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "video.mp4";
        const path = selectedEpisodeId + "/" + item.quality.toLowerCase() + "-" + createStorageObjectId() + "-" + safeName;
        pendingUploadPath = path;
        await uploadVideoResumable(client, item.file, path, setUploadProgress);
        const prior = await client.from("media_video_sources").select("storage_path").eq("episode_id", selectedEpisodeId).eq("quality", item.quality).maybeSingle();
        if (prior.error) throw prior.error;
        const { data: savedSource, error } = await client.from("media_video_sources").upsert({
          episode_id: selectedEpisodeId, quality: item.quality, storage_path: path,
          content_type: contentType, size_bytes: item.file.size,
        }, { onConflict: "episode_id,quality" }).select("storage_path").single();
        if (error) throw error;
        if (!savedSource) throw new Error("The video uploaded, but Studio did not confirm that its file record was saved.");
        pendingUploadPath = null;
        completedQualities.push(item.quality);
        setFiles((current) => ({ ...current, [item.quality]: null }));
        const completedInput = videoFileInputs.current[item.quality];
        if (completedInput) completedInput.value = "";
        const oldPath = prior.data?.storage_path;
        if (oldPath) await client.storage.from("media-videos").remove([oldPath]);
      }
      setUploadQuality(null); setUploadProgress(100);
      const refreshed = await loadStudioData();
      setUploadStatus(refreshed
        ? "Video files uploaded and saved. You can now publish the story."
        : "Video files were uploaded and saved, but the library could not refresh. Reload to confirm the saved versions.");
      setNoticeError(!refreshed);
    } catch (error) {
      let cleanupNote = "";
      if (pendingUploadPath) {
        try {
          const { error: cleanupError } = await client.storage.from("media-videos").remove([pendingUploadPath]);
          if (cleanupError) cleanupNote = " The unfinished upload could not be removed.";
        } catch {
          cleanupNote = " The unfinished upload could not be removed.";
        }
      }
      const completedNote = completedQualities.length ? " Saved successfully: " + completedQualities.join(", ") + "." : "";
      setUploadStatus(formatStudioError(error, "Video upload failed.") + completedNote + cleanupNote); setNoticeError(true);
    } finally {
      setUploadQuality(null);
    }
  }

  function editPlaylist(playlist: PlaylistRow, items: Database["public"]["Tables"]["media_playlist_items"]["Row"][]) {
    setPlaylistForm({
      id: playlist.id, title: playlist.title, description: playlist.description,
      order: String(playlist.sort_order), published: playlist.published,
      episodeIds: items.filter((item) => item.playlist_id === playlist.id).sort((a, b) => a.sort_order - b.sort_order).map((item) => item.episode_id),
    });
  }

  const [playlistItems, setPlaylistItems] = useState<Database["public"]["Tables"]["media_playlist_items"]["Row"][]>([]);
  const loadPlaylistItems = useCallback(async () => {
    if (!client) return;
    const { data, error } = await client.from("media_playlist_items").select("*").order("sort_order");
    if (error) { setNotice(error.message); setNoticeError(true); return; }
    setPlaylistItems(data ?? []);
  }, [client]);
  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => { void loadPlaylistItems(); }, 0);
    return () => window.clearTimeout(timer);
  }, [isAdmin, loadPlaylistItems]);

  function movePlaylistItem(index: number, direction: -1 | 1) {
    setPlaylistForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.episodeIds.length) return current;
      const episodeIds = [...current.episodeIds];
      const moving = episodeIds[index]!;
      episodeIds[index] = episodeIds[nextIndex]!;
      episodeIds[nextIndex] = moving;
      return { ...current, episodeIds };
    });
  }

  async function savePlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const title = playlistForm.title.trim();
    if (!title) { setNotice("Add a playlist title."); setNoticeError(true); return; }
    const values = { title, description: playlistForm.description.trim(), sort_order: Number(playlistForm.order) || 0, published: playlistForm.published };
    let playlistId = playlistForm.id;
    if (playlistId) {
      const { error } = await client.from("media_playlists").update(values).eq("id", playlistId);
      if (error) { setNotice(error.message); setNoticeError(true); return; }
    } else {
      const { data, error } = await client.from("media_playlists").insert(values).select("id").single();
      if (error || !data) { setNotice(error?.message ?? "Playlist could not be created."); setNoticeError(true); return; }
      playlistId = data.id;
    }
    const deleted = await client.from("media_playlist_items").delete().eq("playlist_id", playlistId);
    if (deleted.error) { setNotice(deleted.error.message); setNoticeError(true); return; }
    if (playlistForm.episodeIds.length) {
      const rows = playlistForm.episodeIds.map((episodeId, index) => ({ playlist_id: playlistId, episode_id: episodeId, sort_order: index }));
      const inserted = await client.from("media_playlist_items").insert(rows);
      if (inserted.error) { setNotice(inserted.error.message); setNoticeError(true); return; }
    }
    setPlaylistForm((current) => ({ ...current, id: playlistId }));
    setNotice("Playlist saved."); setNoticeError(false);
    await loadStudioData(); await loadPlaylistItems();
  }

  async function moderateComment(commentId: string, status: "approved" | "rejected") {
    if (!client) return;
    const { error } = await client.from("episode_comments").update({ status }).eq("id", commentId);
    if (error) { setNotice(error.message); setNoticeError(true); return; }
    setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, status } : comment));
  }

  const visibleComments = comments.filter((comment) => commentFilter === "all" || comment.status === commentFilter);

  if (!isSupabaseConfigured()) return (
    <main id="main-content" className="studio-page"><section className="studio-gate">
      <span className="studio-mark"><LockKeyhole size={24} /></span><h1>Studio setup needed</h1>
      <p>The private video Studio will appear after the site owner connects the Supabase project and deploys the media migration.</p>
    </section></main>
  );

  if (!client) return (
    <main id="main-content" className="studio-page"><section className="studio-gate" role="status">
      <span className="studio-mark"><LoaderCircle className="studio-spin" size={24} /></span><h1>Opening the Upper Room</h1>
      <p>Connecting to the secure media library…</p>
    </section></main>
  );

  if (authLoading) return <main id="main-content" className="studio-page"><div className="studio-gate" role="status"><LoaderCircle className="studio-spin" /><p>Checking Studio access…</p></div></main>;

  if (!session) return (
    <main id="main-content" className="studio-page">
      <section className="studio-gate">
        <span className="studio-mark"><LockKeyhole size={24} /></span>
        <p className="media-kicker">PRIVATE ADMIN AREA</p><h1>Journey Studio</h1>
        <p>Request a sign-in link with an email already invited by the site owner. Public visitors can watch and comment without an account.</p>
        {notice && <p className={"studio-notice" + (noticeError ? " is-error" : "")} role="status">{notice}</p>}
        <form className="studio-sign-in" onSubmit={requestSignIn}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <button className="button button-gold" type="submit" disabled={sendingLink}><Mail size={16} />{sendingLink ? "Sending link…" : "Email me a sign-in link"}</button>
        </form>
      </section>
    </main>
  );

  if (!isAdmin) return (
    <main id="main-content" className="studio-page">
      <section className="studio-gate">
        <span className="studio-mark"><LockKeyhole size={24} /></span><h1>Studio access is restricted</h1>
        <p>This signed-in account is not listed as a Journey Studio admin.</p>
        {notice && <p className="studio-notice is-error" role="status">{notice}</p>}
        <button className="button button-outline" onClick={() => void signOut()}><LogOut size={16} />Sign out</button>
      </section>
    </main>
  );

  return (
    <main id="main-content" className="studio-page">
      <div className="page-width">
        <header className="studio-topbar">
          <div><p className="media-kicker">PRIVATE ADMIN AREA</p><h1>Journey Studio</h1><p>Upload video versions, organize public playlists, edit character dossiers, and review community comments.</p></div>
          <div className="studio-account"><span>{session.user.email}</span><button className="button button-outline" onClick={() => void signOut()}><LogOut size={15} />Sign out</button></div>
        </header>
        {notice && <p className={"studio-notice" + (noticeError ? " is-error" : "")} role="status">{notice}</p>}
        <div className="studio-tabs" role="tablist" aria-label="Studio tools">
          <button type="button" role="tab" aria-selected={section === "episodes"} onClick={() => setSection("episodes")}><Film size={16} />Videos <span>{episodes.length}</span></button>
          <button type="button" role="tab" aria-selected={section === "playlists"} onClick={() => setSection("playlists")}><ListVideo size={16} />Playlists <span>{playlists.length}</span></button>
          <button type="button" role="tab" aria-selected={section === "comments"} onClick={() => setSection("comments")}><MessageCircle size={16} />Comments <span>{comments.filter((item) => item.status === "pending").length}</span></button>
          <button type="button" role="tab" aria-selected={section === "characters"} onClick={() => setSection("characters")}><Users size={16} />Characters</button>
          <button type="button" role="tab" aria-selected={section === "staff"} onClick={() => setSection("staff")}><Users size={16} />Staff</button>
        </div>
        {loadingData && <p className="studio-loading" role="status"><LoaderCircle className="studio-spin" size={16} />Loading Studio…</p>}

        {section === "episodes" && (
          <div className="studio-content-grid">
            <section className="studio-panel studio-library">
              <div className="studio-panel-heading"><div><h2>Video library</h2><p>Drafts stay private until published.</p></div><button type="button" className="studio-small-button" onClick={newEpisode}><Plus size={15} />New video</button></div>
              {episodes.length === 0 ? <p className="studio-empty">No videos yet. Create a story to begin.</p> : episodes.map((episode) => (
                <div key={episode.id} className="studio-video-row">
                  <button type="button" className={"studio-list-item" + (selectedEpisodeId === episode.id ? " is-selected" : "")} onClick={() => editEpisode(episode)}>
                    <span><strong>{episode.title}</strong><small>{episode.orientation === "portrait" ? "9:16" : "16:9"} · {(episode.youtube_id ? "YouTube" + (episode.sources.length ? ", " : "") : "") + (episode.sources.map((source) => source.quality).join(", ") || (episode.youtube_id ? "" : "No video"))} · {episode.published ? "Published" : "Draft / hidden"}</small></span>
                    <span className={"studio-status" + (episode.published ? " is-live" : "")}>{episode.published ? "LIVE" : "PRIVATE"}</span>
                  </button>
                  <div className="studio-video-actions" aria-label={"Actions for " + episode.title}>
                    <button type="button" disabled={Boolean(busyEpisodeId) || savingEpisode || Boolean(uploadQuality)}
                      aria-label={(episode.published ? "Hide " : "Publish ") + episode.title}
                      onClick={() => void toggleEpisodeVisibility(episode)}>
                      {episode.published ? <EyeOff size={14} /> : <Eye size={14} />}
                      {episode.published ? "Hide" : "Show"}
                    </button>
                    <button type="button" className="studio-video-delete" disabled={Boolean(busyEpisodeId) || savingEpisode || Boolean(uploadQuality)}
                      aria-label={"Permanently delete " + episode.title}
                      onClick={() => void deleteEpisode(episode)}>
                      <Trash2 size={14} />Delete
                    </button>
                  </div>
                </div>
              ))}
            </section>
            <div className="studio-editor-stack">
              <form className="studio-panel studio-form" onSubmit={saveEpisode}>
                <div className="studio-panel-heading"><div><h2>{episodeForm.id ? "Edit story" : "New story"}</h2><p>Set details and player shape.</p></div></div>
                <div className="studio-form-grid">
                  <label className="studio-span-two">Title<input value={episodeForm.title} onChange={(event) => setEpisodeForm({ ...episodeForm, title: event.target.value })} maxLength={180} required /></label>
                  <label>Story ID<input value={episodeForm.id} onChange={(event) => setEpisodeForm({ ...episodeForm, id: event.target.value.toLocaleLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="created-from-title" /></label>
                  <label>Episode number<input type="number" min="1" value={episodeForm.number} onChange={(event) => setEpisodeForm({ ...episodeForm, number: event.target.value })} required /></label>
                  <label>Aspect ratio<select value={episodeForm.orientation} onChange={(event) => setEpisodeForm({ ...episodeForm, orientation: event.target.value as EpisodeForm["orientation"] })}><option value="landscape">16:9 landscape</option><option value="portrait">9:16 portrait</option></select></label>
                  <label>Duration, seconds<input type="number" min="0" value={episodeForm.duration} onChange={(event) => setEpisodeForm({ ...episodeForm, duration: event.target.value })} placeholder="Optional" /></label>
                  <label className="studio-span-two">Scripture reference<input value={episodeForm.scripture} onChange={(event) => setEpisodeForm({ ...episodeForm, scripture: event.target.value })} maxLength={180} /></label>
                  <label className="studio-span-two">Thumbnail URL<input type="url" value={episodeForm.thumbnail} onChange={(event) => { setEpisodeForm({ ...episodeForm, thumbnail: event.target.value }); setThumbnailFile(null); if (thumbnailFileInput.current) thumbnailFileInput.current.value = ""; }} placeholder="Optional HTTPS image" /></label>
                  <label className="studio-span-two studio-upload-field"><span>Or upload a thumbnail image</span><input ref={thumbnailFileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)} /><small>{thumbnailFile?.name ?? "JPEG, PNG, WebP, or AVIF · up to 10 MB · saved with story details"}</small></label>
                  <label className="studio-span-two">YouTube video link<input type="url" value={episodeForm.youtubeUrl} onChange={(event) => setEpisodeForm({ ...episodeForm, youtubeUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." /><small>Optional. Paste a YouTube watch, share, Shorts, or live link. Save the story to enable YouTube playback without uploading a video file. Clear the link and save to use uploaded video versions instead.</small></label>
                  <label className="studio-span-two">Description<textarea value={episodeForm.description} onChange={(event) => setEpisodeForm({ ...episodeForm, description: event.target.value })} maxLength={5000} rows={4} /></label>
                  <label className="studio-span-two">Transcript<textarea value={episodeForm.transcript} onChange={(event) => setEpisodeForm({ ...episodeForm, transcript: event.target.value })} maxLength={100000} rows={8} placeholder="Paste an approved transcript. No transcript is generated automatically." /><small>Visitors can read and download this text. Up to 100,000 characters.</small></label>
                  <label className="studio-span-two">ASL interpretation video link<input type="url" value={episodeForm.aslUrl} onChange={(event) => setEpisodeForm({ ...episodeForm, aslUrl: event.target.value })} placeholder="https://…" /><small>Optional HTTPS link to an interpreter-produced ASL video. MP4/WebM video links play inline; YouTube links embed in the media section.</small></label>
                  <label className="studio-check"><input type="checkbox" checked={episodeForm.published} onChange={(event) => setEpisodeForm({ ...episodeForm, published: event.target.checked })} />Publish in the public library</label>
                </div>
                <button className="button button-gold" type="submit" disabled={savingEpisode || Boolean(uploadQuality)}><Check size={16} />{savingEpisode ? "Saving…" : thumbnailFile ? "Save story and thumbnail" : "Save story details"}</button>
              </form>
              <section className="studio-panel studio-form" aria-labelledby="studio-caption-heading">
                <div className="studio-panel-heading"><div><h2 id="studio-caption-heading">Captions and subtitles</h2><p>Attach administrator-prepared WebVTT files to direct video playback. YouTube caption controls remain inside the YouTube player and cannot be managed here.</p></div></div>
                {!selectedEpisodeId && <p className="studio-file-hint">Save the story details before attaching a caption file.</p>}
                {selectedEpisodeId && (
                  <>
                    <p className="studio-file-hint">Story ID: <strong>{selectedEpisodeId}</strong></p>
                    <div className="studio-caption-list" aria-label="Attached caption tracks">
                      {(episodes.find((episode) => episode.id === selectedEpisodeId)?.captions ?? []).length === 0
                        ? <p className="studio-empty">No caption or subtitle files are attached to this story yet.</p>
                        : (episodes.find((episode) => episode.id === selectedEpisodeId)?.captions ?? []).map((caption) => (
                          <div className="studio-caption-row" key={caption.id}>
                            <span><strong>{caption.label}</strong><small>{caption.language} · {caption.kind}{caption.is_default ? " · Default" : ""}</small></span>
                            <button type="button" className="studio-video-delete" disabled={captionBusy} onClick={() => void deleteCaption(caption)} aria-label={`Remove ${caption.label} caption track`}><Trash2 size={14} />Remove</button>
                          </div>
                        ))}
                    </div>
                    <form className="studio-caption-upload" onSubmit={uploadCaption}>
                      <label className="studio-span-two studio-upload-field"><span>WebVTT file</span><input ref={captionFileInput} type="file" accept=".vtt,text/vtt" onChange={(event) => setCaptionFile(event.target.files?.[0] ?? null)} /><small>{captionFile?.name ?? "Interpreter-prepared .vtt · up to 2 MB"}</small></label>
                      <label>Language code<input value={captionLanguage} onChange={(event) => setCaptionLanguage(event.target.value)} placeholder="en or fr-CA" maxLength={35} required /></label>
                      <label>Player label<input value={captionLabel} onChange={(event) => setCaptionLabel(event.target.value)} placeholder="English captions" maxLength={80} required /></label>
                      <label>Track type<select value={captionKind} onChange={(event) => setCaptionKind(event.target.value as "captions" | "subtitles")}><option value="captions">Captions</option><option value="subtitles">Subtitles</option></select></label>
                      <label className="studio-check"><input type="checkbox" checked={captionDefault} onChange={(event) => setCaptionDefault(event.target.checked)} />Enable this track by default when available</label>
                      <button className="button button-outline" type="submit" disabled={captionBusy || !captionFile}><UploadCloud size={16} />{captionBusy ? "Saving caption…" : "Attach caption file"}</button>
                    </form>
                  </>
                )}
              </section>
              <form className="studio-panel studio-form" onSubmit={uploadSources}>
                <div className="studio-panel-heading"><div><h2>Video versions</h2><p>For direct videos: save story details as a draft, select a file, upload it, then publish. For YouTube: paste a link above and save directly; no file upload is needed. Large MP4, WebM, and QuickTime uploads resume in chunks.</p></div><UploadCloud size={20} /></div>
                {selectedEpisodeId && <p className="studio-file-hint">Story ID: <strong>{selectedEpisodeId}</strong></p>}
                {!selectedEpisodeId && <p className="studio-file-hint">Save this story before uploading its files.</p>}
                <p className="studio-upload-limit"><strong>Supabase Free plan:</strong> Maximum video file size is <strong>50 MB per file</strong>. Studio will check and display the file size when you select it. Larger videos can be added by YouTube link instead.</p>
                <div className="studio-upload-grid">
                  {qualities.map((quality) => (
                    <label className="studio-upload-field" key={quality}>
                      <span>{quality}</span>
                      <input ref={(input) => { if (input) videoFileInputs.current[quality] = input; else delete videoFileInputs.current[quality]; }}
                        type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        onChange={(event) => {
                          const selected = event.target.files?.[0] ?? null;
                          const fileSizeError = selected ? freePlanVideoSizeError(selected) : null;
                          if (fileSizeError) {
                            setFiles((current) => ({ ...current, [quality]: null }));
                            event.target.value = "";
                            setUploadStatus(fileSizeError);
                            setNoticeError(true);
                            return;
                          }
                          setFiles((current) => ({ ...current, [quality]: selected }));
                          setUploadStatus("");
                          setNoticeError(false);
                        }} />
                      <small>{files[quality] ? files[quality]!.name + " · " + formatStudioFileSize(files[quality]!.size) :
                        episodes.find((episode) => episode.id === selectedEpisodeId)?.sources.find((source) => source.quality === quality)?.storage_path.split("/").at(-1) ?? "No file uploaded"}</small>
                    </label>
                  ))}
                </div>
                {uploadQuality && <div className="studio-progress"><span>{uploadQuality} upload</span><progress max="100" value={uploadProgress} />{uploadProgress}%</div>}
                {uploadStatus && <p className={"studio-notice" + (noticeError ? " is-error" : "")} role="status">{uploadStatus}</p>}
                <button type="submit" className="button button-outline" disabled={Boolean(uploadQuality)}><UploadCloud size={16} />{uploadQuality ? "Uploading " + uploadQuality + "…" : "Upload selected versions"}</button>
              </form>
            </div>
          </div>
        )}

        {section === "playlists" && (
          <div className="studio-content-grid">
            <section className="studio-panel studio-library">
              <div className="studio-panel-heading"><div><h2>Playlists</h2><p>Public playlists appear on the Media page.</p></div><button type="button" className="studio-small-button" onClick={() => setPlaylistForm(freshPlaylist())}><Plus size={15} />New playlist</button></div>
              {playlists.length === 0 ? <p className="studio-empty">Create a playlist and add published stories.</p> : playlists.map((item) => (
                <button key={item.id} type="button" className={"studio-list-item" + (playlistForm.id === item.id ? " is-selected" : "")} onClick={() => editPlaylist(item, playlistItems)}>
                  <span><strong>{item.title}</strong><small>{playlistItems.filter((entry) => entry.playlist_id === item.id).length} videos · {item.published ? "Published" : "Draft"}</small></span>
                  <span className={"studio-status" + (item.published ? " is-live" : "")}>{item.published ? "LIVE" : "DRAFT"}</span>
                </button>
              ))}
            </section>
            <form className="studio-panel studio-form studio-playlist-editor" onSubmit={savePlaylist}>
              <div className="studio-panel-heading"><div><h2>{playlistForm.id ? "Edit playlist" : "New playlist"}</h2><p>Choose and order the stories viewers can browse.</p></div></div>
              <label>Playlist title<input value={playlistForm.title} onChange={(event) => setPlaylistForm({ ...playlistForm, title: event.target.value })} maxLength={120} required /></label>
              <label>Description<textarea value={playlistForm.description} onChange={(event) => setPlaylistForm({ ...playlistForm, description: event.target.value })} maxLength={2000} rows={3} /></label>
              <label>Sort order<input type="number" value={playlistForm.order} onChange={(event) => setPlaylistForm({ ...playlistForm, order: event.target.value })} /></label>
              <fieldset className="studio-episode-choices"><legend>Stories in this playlist</legend>
                {episodes.filter((episode) => episode.published).length === 0 ? <p>Publish a video before adding it to a public playlist.</p> : episodes.filter((episode) => episode.published).map((episode) => (
                  <label key={episode.id}><input type="checkbox" checked={playlistForm.episodeIds.includes(episode.id)} onChange={(event) => setPlaylistForm((current) => ({ ...current, episodeIds: event.target.checked ? [...current.episodeIds, episode.id] : current.episodeIds.filter((id) => id !== episode.id) }))} /><span>{episode.title}</span></label>
                ))}
              </fieldset>
              <div className="studio-order-list" aria-label="Playlist story order">
                {playlistForm.episodeIds.map((id, index) => {
                  const title = episodes.find((episode) => episode.id === id)?.title ?? id;
                  return <div className="studio-order-row" key={id}>
                    <span>{index + 1}. {title}</span>
                    <span>
                      <button type="button" aria-label={"Move " + title + " up"} disabled={index === 0} onClick={() => movePlaylistItem(index, -1)}>↑</button>
                      <button type="button" aria-label={"Move " + title + " down"} disabled={index === playlistForm.episodeIds.length - 1} onClick={() => movePlaylistItem(index, 1)}>↓</button>
                    </span>
                  </div>;
                })}
              </div>
              <label className="studio-check"><input type="checkbox" checked={playlistForm.published} onChange={(event) => setPlaylistForm({ ...playlistForm, published: event.target.checked })} />Publish this playlist</label>
              <button className="button button-gold" type="submit"><Check size={16} />Save playlist</button>
            </form>
          </div>
        )}

        {section === "comments" && (
          <section className="studio-panel studio-comments">
            <div className="studio-panel-heading"><div><h2>Community comments</h2><p>Visitors comment without signing in. Approve a comment to show it under its story.</p></div><MessageCircle size={20} /></div>
            <div className="studio-comment-toolbar">
              <label htmlFor="studio-comment-filter">Show comments
                <select id="studio-comment-filter" value={commentFilter}
                  onChange={(event) => setCommentFilter(event.target.value as typeof commentFilter)}>
                  <option value="pending">Pending ({comments.filter((item) => item.status === "pending").length})</option>
                  <option value="approved">Approved ({comments.filter((item) => item.status === "approved").length})</option>
                  <option value="rejected">Rejected ({comments.filter((item) => item.status === "rejected").length})</option>
                  <option value="all">All ({comments.length})</option>
                </select>
              </label>
              <button className="button button-outline" type="button" onClick={() => void loadStudioData()} disabled={loadingData}>Refresh comments</button>
            </div>
            {visibleComments.length === 0 ? <p className="studio-empty">No {commentFilter === "all" ? "" : commentFilter + " "}comments to review.</p> : visibleComments.map((comment) => (
              <article className="studio-comment" key={comment.id}>
                <div><strong>{comment.display_name}</strong><span className={"studio-status" + (comment.status === "approved" ? " is-live" : "")}>{comment.status.toUpperCase()}</span><time>{new Date(comment.created_at).toLocaleString()}</time></div>
                <p className="studio-comment-episode">{comment.episode_id === "media-community" ? "Media community · General discussion" : (episodes.find((episode) => episode.id === comment.episode_id)?.title ?? "Story") + " · " + comment.episode_id}</p>
                <p>{comment.body}</p>
                {comment.status === "pending" && <div className="studio-comment-actions"><button type="button" className="studio-approve" onClick={() => void moderateComment(comment.id, "approved")}><Check size={14} />Approve</button><button type="button" className="studio-reject" onClick={() => void moderateComment(comment.id, "rejected")}><X size={14} />Reject</button></div>}
                {comment.status === "approved" && <button type="button" className="studio-reject" onClick={() => void moderateComment(comment.id, "rejected")}><X size={14} />Hide comment</button>}
                {comment.status === "rejected" && <button type="button" className="studio-approve" onClick={() => void moderateComment(comment.id, "approved")}><Check size={14} />Restore and approve</button>}
              </article>
            ))}
          </section>
        )}

        {section === "characters" && <StudioCharacters client={client} onNotice={reportStudioNotice} />}
        {section === "staff" && <StudioStaff client={client} onNotice={reportStudioNotice} />}
      </div>
    </main>
  );
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function errorMessage(error: unknown): string {
  return formatStudioError(error, "Studio could not complete that request.");
}

function signInErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "otp_disabled":
      return "Email sign-in is disabled for this project. The site administrator must enable Email Magic Link / OTP in Supabase Authentication settings.";
    case "over_email_send_rate_limit":
      return "The email sending limit has been reached. Wait before requesting another sign-in link.";
    case "over_request_rate_limit":
      return "Too many sign-in requests were made. Wait a few minutes, then try again.";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "This sign-in link has expired or was already used. Request a fresh link and open it once.";
    case "redirect_to_not_allowed":
      return "Supabase blocked the Studio redirect. The site administrator must add this site's Studio URL to the Supabase Auth redirect allow list.";
    case "callback_error":
      return "The sign-in link could not be verified. Request a fresh link and open it once in this browser.";
    default:
      return fallback || "Sign-in could not be completed. Please try again.";
  }
}

function consumeAuthCallbackNotice(): string | null {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const errorCode = url.searchParams.get("error_code") ?? hashParams.get("error_code");
  const hasCallbackError = Boolean(errorCode || url.searchParams.has("error") || hashParams.has("error"));
  if (!hasCallbackError) return null;

  const authErrorParams = ["error", "error_code", "error_description", "error_hint", "error_uri"];
  authErrorParams.forEach((key) => {
    url.searchParams.delete(key);
    hashParams.delete(key);
  });
  url.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";
  window.history.replaceState(window.history.state, "", url.toString());

  return signInErrorMessage(errorCode ?? "callback_error");
}

function getVideoContentType(file: File): VideoContentType {
  const contentType = file.type || (file.name.toLowerCase().endsWith(".webm") ? "video/webm" : file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4");
  if (contentType !== "video/mp4" && contentType !== "video/webm" && contentType !== "video/quicktime") {
    throw new Error("Choose an MP4, WebM, or QuickTime video file.");
  }
  return contentType;
}
