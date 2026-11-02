import type { Episode, MediaPlaylist } from "@/data/episodes";
import type { VideoQuality } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type EpisodeRow = { id: string; title: string; description: string; scripture_reference: string | null; thumbnail_url: string | null; duration_seconds: number | null; episode_number: number; orientation: "landscape" | "portrait" };
type SourceRow = { episode_id: string; quality: VideoQuality; storage_path: string };
type PlaylistRow = { id: string; title: string; description: string; sort_order: number };
type PlaylistItemRow = { playlist_id: string; episode_id: string; sort_order: number };
export type PublishedMediaCatalog = { episodes: Episode[]; playlists: MediaPlaylist[] };

export async function loadPublishedMediaCatalog(): Promise<PublishedMediaCatalog> {
  const client = createBrowserSupabaseClient();
  if (!client) return { episodes: [], playlists: [] };
  const [episodeResult, playlistResult] = await Promise.all([
    client.from("media_episodes").select("id, title, description, scripture_reference, thumbnail_url, duration_seconds, episode_number, orientation").eq("published", true).order("episode_number"),
    client.from("media_playlists").select("id, title, description, sort_order").eq("published", true).order("sort_order"),
  ]);
  if (episodeResult.error) throw episodeResult.error;
  if (playlistResult.error) throw playlistResult.error;
  const rows = (episodeResult.data ?? []) as EpisodeRow[];
  const playlistRows = (playlistResult.data ?? []) as PlaylistRow[];
  const episodeIds = rows.map((item) => item.id);
  const playlistIds = playlistRows.map((item) => item.id);
  const [sourceResult, itemResult] = await Promise.all([
    episodeIds.length ? client.from("media_video_sources").select("episode_id, quality, storage_path").in("episode_id", episodeIds) : Promise.resolve({ data: [], error: null }),
    playlistIds.length ? client.from("media_playlist_items").select("playlist_id, episode_id, sort_order").in("playlist_id", playlistIds).order("sort_order") : Promise.resolve({ data: [], error: null }),
  ]);
  if (sourceResult.error) throw sourceResult.error;
  if (itemResult.error) throw itemResult.error;
  const sources = (sourceResult.data ?? []) as SourceRow[];
  const paths = sources.map((item) => item.storage_path);
  const signed = paths.length ? await client.storage.from("media-videos").createSignedUrls(paths, 604800) : { data: [], error: null };
  if (signed.error) throw signed.error;
  const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
  const byEpisode = new Map<string, { label: string; url: string }[]>();
  for (const source of sources) {
    const url = urls.get(source.storage_path);
    if (url) byEpisode.set(source.episode_id, [...(byEpisode.get(source.episode_id) ?? []), { label: source.quality, url }]);
  }
  const episodes = rows.map((row): Episode => ({
    id: row.id, title: row.title, description: row.description,
    scriptureReference: row.scripture_reference ?? undefined, thumbnail: row.thumbnail_url ?? undefined,
    duration: formatDuration(row.duration_seconds), episodeNumber: row.episode_number,
    orientation: row.orientation, videoSources: byEpisode.get(row.id) ?? [], published: true,
  }));
  const items = (itemResult.data ?? []) as PlaylistItemRow[];
  const playlists = playlistRows.map((row): MediaPlaylist => ({
    id: row.id, title: row.title, description: row.description, sortOrder: row.sort_order,
    episodeIds: items.filter((item) => item.playlist_id === row.id).map((item) => item.episode_id),
  }));
  return { episodes, playlists };
}

function formatDuration(seconds: number | null): string | undefined {
  if (seconds === null || !Number.isFinite(seconds)) return undefined;
  return Math.floor(seconds / 60) + ":" + Math.floor(seconds % 60).toString().padStart(2, "0");
}
