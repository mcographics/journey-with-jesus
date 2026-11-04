"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import type { Episode, MediaPlaylist } from "@/data/episodes";
import { episodeHref, resolveEpisodeId } from "@/lib/episode-navigation";
import { loadPublishedMediaCatalog } from "@/lib/media-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { CommentSection } from "@/components/CommentSection";
import { EpisodePlaylist } from "@/components/EpisodePlaylist";
import { VideoPlayer } from "@/components/VideoPlayer";

const mediaPageStyle = {
  "--media-background-image": "url(\"../images/biblical-sunset-over-unbroken-valley.webp\")",
} as CSSProperties & { "--media-background-image": string };

function subscribeToNavigation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}
function getSearch() { return window.location.search; }
function getServerSearch() { return ""; }

export function MediaExperience({ episodes: initialEpisodes }: { episodes: Episode[] }) {
  const search = useSyncExternalStore(subscribeToNavigation, getSearch, getServerSearch);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [playlistId, setPlaylistId] = useState("all");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "unconfigured" | "error">(() =>
    initialEpisodes.length ? "ready" : isSupabaseConfigured() ? "loading" : "unconfigured",
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    void loadPublishedMediaCatalog().then((catalog) => {
      if (!active) return;
      setEpisodes(catalog.episodes);
      setPlaylists(catalog.playlists);
      setCatalogStatus("ready");
    }).catch(() => {
      if (active) setCatalogStatus("error");
    });
    return () => { active = false; };
  }, [initialEpisodes]);

  const selectedId = resolveEpisodeId(search, episodes);
  const selectedEpisode = episodes.find((episode) => episode.id === selectedId) ?? null;
  const selectEpisode = (episode: Episode) => {
    window.history.pushState({}, "", episodeHref(window.location.href, episode.id));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <main id="main-content" className="media-page" style={mediaPageStyle}>
      <div className="page-width">
        <header className="media-heading">
          <p className="media-kicker">FAITH · HOPE · STORY</p>
          <h1>Animated stories of faith.</h1>
          <p>Explore the life and teachings of Jesus through Scripture-inspired animation. Each story is made to watch at your pace and in the format that fits your screen. Watching and commenting are open to everyone.</p>
        </header>
        {catalogStatus === "loading" && episodes.length === 0 && <p className="catalog-notice" role="status">Loading the story library…</p>}
        {catalogStatus === "unconfigured" && episodes.length === 0 && <p className="catalog-notice" role="status">The public story library is being prepared. Please check back soon.</p>}
        {catalogStatus === "error" && <p className="catalog-notice is-error" role="status">The story library could not be reached. Please refresh to try again.</p>}
        <div className="media-layout">
          <div className="media-main">
            <VideoPlayer key={"player-" + (selectedEpisode?.id ?? "none")} episode={selectedEpisode} />
            <CommentSection key={"comments-" + (selectedEpisode?.id ?? "none")} episode={selectedEpisode} />
          </div>
          <EpisodePlaylist episodes={episodes} playlists={playlists} selectedPlaylistId={playlistId}
            onPlaylistChange={setPlaylistId} selectedId={selectedId} onSelect={selectEpisode} />
        </div>
      </div>
    </main>
  );
}
