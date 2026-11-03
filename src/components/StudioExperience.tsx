"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Film, ListVideo, LoaderCircle, LockKeyhole, LogOut, Mail, MessageCircle, Plus, UploadCloud, Users, X } from "lucide-react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database, VideoContentType, VideoQuality } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { uploadVideoResumable } from "@/lib/supabase/resumable-upload";
import { StudioCharacters } from "@/components/StudioCharacters";

type SourceRow = Database["public"]["Tables"]["media_video_sources"]["Row"];
type EpisodeRow = Database["public"]["Tables"]["media_episodes"]["Row"];
type PlaylistRow = Database["public"]["Tables"]["media_playlists"]["Row"];
type CommentRow = Database["public"]["Tables"]["episode_comments"]["Row"];
type StudioEpisode = EpisodeRow & { sources: SourceRow[] };
type EpisodeForm = {
  id: string; title: string; description: string; scripture: string; thumbnail: string;
  duration: string; number: string; orientation: "landscape" | "portrait"; published: boolean;
};
type PlaylistForm = { id: string; title: string; description: string; order: string; published: boolean; episodeIds: string[] };
type Section = "episodes" | "playlists" | "comments" | "characters";
const qualities: VideoQuality[] = ["720p", "1080p", "4K"];
const freshEpisode = (): EpisodeForm => ({ id: "", title: "", description: "", scripture: "", thumbnail: "", duration: "", number: "1", orientation: "landscape", published: false });
const freshPlaylist = (): PlaylistForm => ({ id: "", title: "", description: "", order: "0", published: false, episodeIds: [] });

export function StudioExperience() {
  const client = useMemo(() => createBrowserSupabaseClient(), []);
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
  const [loadingData, setLoadingData] = useState(false);
  const [episodeForm, setEpisodeForm] = useState<EpisodeForm>(freshEpisode);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [files, setFiles] = useState<Record<VideoQuality, File | null>>({ "720p": null, "1080p": null, "4K": null });
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadQuality, setUploadQuality] = useState<VideoQuality | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playlistForm, setPlaylistForm] = useState<PlaylistForm>(freshPlaylist);
  const reportStudioNotice = useCallback((message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
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
        if (error) { setNotice(error.message); setNoticeError(true); }
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
    if (!client) return;
    setLoadingData(true);
    try {
      const [episodeResult, sourceResult, playlistResult, commentResult] = await Promise.all([
        client.from("media_episodes").select("*").order("episode_number"),
        client.from("media_video_sources").select("*"),
        client.from("media_playlists").select("*").order("sort_order"),
        client.from("episode_comments").select("id, episode_id, display_name, body, status, created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      if (episodeResult.error) throw episodeResult.error;
      if (sourceResult.error) throw sourceResult.error;
      if (playlistResult.error) throw playlistResult.error;
      if (commentResult.error) throw commentResult.error;
      const sourceRows = sourceResult.data ?? [];
      setEpisodes((episodeResult.data ?? []).map((episode) => ({
        ...episode,
        sources: sourceRows.filter((source) => source.episode_id === episode.id),
      })));
      setPlaylists(playlistResult.data ?? []);
      setComments(commentResult.data ?? []);
    } catch (error) {
      setNotice(errorMessage(error));
      setNoticeError(true);
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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/journey-with-jesus";
    const redirect = window.location.origin + basePath.replace(/\/$/, "") + "/studio";
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect, shouldCreateUser: false },
    });
    setSendingLink(false);
    if (error) { setNotice(error.message); setNoticeError(true); }
    else setNotice("Sign-in link sent. Check your email, then return here to open Studio.");
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
      scripture: episode.scripture_reference ?? "", thumbnail: episode.thumbnail_url ?? "",
      duration: episode.duration_seconds === null ? "" : String(episode.duration_seconds),
      number: String(episode.episode_number), orientation: episode.orientation, published: episode.published,
    });
    setFiles({ "720p": null, "1080p": null, "4K": null });
    setUploadStatus("");
  }

  function newEpisode() {
    setSelectedEpisodeId(""); setEpisodeForm(freshEpisode());
    setFiles({ "720p": null, "1080p": null, "4K": null }); setUploadStatus("");
  }

  async function saveEpisode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const id = episodeForm.id.trim() || slugify(episodeForm.title);
    if (!id) { setNotice("Add a title so Studio can create a story ID."); setNoticeError(true); return; }
    const existing = episodes.find((episode) => episode.id === id);
    if (episodeForm.published && !(existing?.sources.length)) {
      setNotice("Upload at least one video quality before publishing this story."); setNoticeError(true); return;
    }
    const payload = {
      id, title: episodeForm.title.trim(), description: episodeForm.description.trim(),
      scripture_reference: episodeForm.scripture.trim() || null,
      thumbnail_url: episodeForm.thumbnail.trim() || null,
      duration_seconds: episodeForm.duration.trim() ? Number(episodeForm.duration) : null,
      episode_number: Number(episodeForm.number) || 1, orientation: episodeForm.orientation,
      published: episodeForm.published,
    };
    const { error } = await client.from("media_episodes").upsert(payload);
    if (error) { setNotice(error.message); setNoticeError(true); return; }
    setEpisodeForm((current) => ({ ...current, id }));
    setSelectedEpisodeId(id); setNotice("Story details saved."); setNoticeError(false);
    await loadStudioData();
  }

  async function uploadSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !selectedEpisodeId) { setUploadStatus("Save the story details before uploading video files."); return; }
    const selectedFiles = qualities.flatMap((quality) => files[quality] ? [{ quality, file: files[quality]! }] : []);
    if (selectedFiles.length === 0) { setUploadStatus("Choose one or more video files first."); return; }
    setUploadStatus(""); setNoticeError(false);
    try {
      for (const item of selectedFiles) {
        const contentType = getVideoContentType(item.file);
        setUploadQuality(item.quality); setUploadProgress(0);
        const safeName = item.file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "video.mp4";
        const path = selectedEpisodeId + "/" + item.quality.toLowerCase() + "-" + Date.now() + "-" + safeName;
        await uploadVideoResumable(client, item.file, path, setUploadProgress);
        const prior = await client.from("media_video_sources").select("storage_path").eq("episode_id", selectedEpisodeId).eq("quality", item.quality).maybeSingle();
        if (prior.error) throw prior.error;
        const { error } = await client.from("media_video_sources").upsert({
          episode_id: selectedEpisodeId, quality: item.quality, storage_path: path,
          content_type: contentType, size_bytes: item.file.size,
        }, { onConflict: "episode_id,quality" });
        if (error) throw error;
        const oldPath = prior.data?.storage_path;
        if (oldPath) await client.storage.from("media-videos").remove([oldPath]);
      }
      setUploadStatus("Video files uploaded. You can now publish the story.");
      setUploadQuality(null); setUploadProgress(100);
      setFiles({ "720p": null, "1080p": null, "4K": null });
      await loadStudioData();
    } catch (error) {
      setUploadStatus(errorMessage(error)); setNoticeError(true); setUploadQuality(null);
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

  if (!client) return (
    <main id="main-content" className="studio-page"><section className="studio-gate">
      <span className="studio-mark"><LockKeyhole size={24} /></span><h1>Studio setup needed</h1>
      <p>The private video Studio will appear after the site owner connects the Supabase project and deploys the media migration.</p>
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
        </div>
        {loadingData && <p className="studio-loading" role="status"><LoaderCircle className="studio-spin" size={16} />Loading Studio…</p>}

        {section === "episodes" && (
          <div className="studio-content-grid">
            <section className="studio-panel studio-library">
              <div className="studio-panel-heading"><div><h2>Video library</h2><p>Drafts stay private until published.</p></div><button type="button" className="studio-small-button" onClick={newEpisode}><Plus size={15} />New video</button></div>
              {episodes.length === 0 ? <p className="studio-empty">No videos yet. Create a story to begin.</p> : episodes.map((episode) => (
                <button key={episode.id} type="button" className={"studio-list-item" + (selectedEpisodeId === episode.id ? " is-selected" : "")} onClick={() => editEpisode(episode)}>
                  <span><strong>{episode.title}</strong><small>{episode.orientation === "portrait" ? "9:16" : "16:9"} · {episode.sources.map((source) => source.quality).join(", ") || "No video"} · {episode.published ? "Published" : "Draft"}</small></span>
                  <span className={"studio-status" + (episode.published ? " is-live" : "")}>{episode.published ? "LIVE" : "DRAFT"}</span>
                </button>
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
                  <label className="studio-span-two">Thumbnail URL<input type="url" value={episodeForm.thumbnail} onChange={(event) => setEpisodeForm({ ...episodeForm, thumbnail: event.target.value })} placeholder="Optional HTTPS image" /></label>
                  <label className="studio-span-two">Description<textarea value={episodeForm.description} onChange={(event) => setEpisodeForm({ ...episodeForm, description: event.target.value })} maxLength={5000} rows={4} /></label>
                  <label className="studio-check"><input type="checkbox" checked={episodeForm.published} onChange={(event) => setEpisodeForm({ ...episodeForm, published: event.target.checked })} />Publish in the public library</label>
                </div>
                <button className="button button-gold" type="submit"><Check size={16} />Save story details</button>
              </form>
              <form className="studio-panel studio-form" onSubmit={uploadSources}>
                <div className="studio-panel-heading"><div><h2>Video versions</h2><p>Upload prepared MP4, WebM, or QuickTime files. Large uploads resume in chunks.</p></div><UploadCloud size={20} /></div>
                {selectedEpisodeId && <p className="studio-file-hint">Story ID: <strong>{selectedEpisodeId}</strong></p>}
                {!selectedEpisodeId && <p className="studio-file-hint">Save this story before uploading its files.</p>}
                <div className="studio-upload-grid">
                  {qualities.map((quality) => (
                    <label className="studio-upload-field" key={quality}><span>{quality}</span><input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={(event) => setFiles({ ...files, [quality]: event.target.files?.[0] ?? null })} />
                      <small>{files[quality]?.name ?? episodes.find((episode) => episode.id === selectedEpisodeId)?.sources.find((source) => source.quality === quality)?.storage_path.split("/").at(-1) ?? "No file uploaded"}</small>
                    </label>
                  ))}
                </div>
                {uploadQuality && <div className="studio-progress"><span>{uploadQuality} upload</span><progress max="100" value={uploadProgress} />{uploadProgress}%</div>}
                {uploadStatus && <p className={"studio-notice" + (noticeError ? " is-error" : "")} role="status">{uploadStatus}</p>}
                <button type="submit" className="button button-outline" disabled={!selectedEpisodeId || Boolean(uploadQuality)}><UploadCloud size={16} />{uploadQuality ? "Uploading " + uploadQuality + "…" : "Upload selected versions"}</button>
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
            {comments.length === 0 ? <p className="studio-empty">No comments have been submitted.</p> : comments.map((comment) => (
              <article className="studio-comment" key={comment.id}>
                <div><strong>{comment.display_name}</strong><span className={"studio-status" + (comment.status === "approved" ? " is-live" : "")}>{comment.status.toUpperCase()}</span><time>{new Date(comment.created_at).toLocaleString()}</time></div>
                <p className="studio-comment-episode">{episodes.find((episode) => episode.id === comment.episode_id)?.title ?? "Story"} · {comment.episode_id}</p>
                <p>{comment.body}</p>
                {comment.status === "pending" && <div className="studio-comment-actions"><button type="button" className="studio-approve" onClick={() => void moderateComment(comment.id, "approved")}><Check size={14} />Approve</button><button type="button" className="studio-reject" onClick={() => void moderateComment(comment.id, "rejected")}><X size={14} />Reject</button></div>}
                {comment.status === "approved" && <button type="button" className="studio-reject" onClick={() => void moderateComment(comment.id, "rejected")}><X size={14} />Hide comment</button>}
              </article>
            ))}
          </section>
        )}

        {section === "characters" && <StudioCharacters client={client} onNotice={reportStudioNotice} />}
      </div>
    </main>
  );
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Studio could not complete that request.";
}
function getVideoContentType(file: File): VideoContentType {
  const contentType = file.type || (file.name.toLowerCase().endsWith(".webm") ? "video/webm" : file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4");
  if (contentType !== "video/mp4" && contentType !== "video/webm" && contentType !== "video/quicktime") {
    throw new Error("Choose an MP4, WebM, or QuickTime video file.");
  }
  return contentType;
}
