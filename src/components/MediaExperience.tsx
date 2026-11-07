"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { Film, MessageCircle, Smartphone, Users } from "lucide-react";
import type { Episode, MediaPlaylist } from "@/data/episodes";
import { episodeHref, resolveEpisodeId } from "@/lib/episode-navigation";
import { loadPublishedMediaCatalog } from "@/lib/media-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { CommentSection } from "@/components/CommentSection";
import { EpisodePlaylist } from "@/components/EpisodePlaylist";
import { VideoPlayer } from "@/components/VideoPlayer";

type MediaKind = "videos" | "stories";
type DiscussionKind = "comments" | "community";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const mediaPageStyle = {
  "--media-background-image-1440": `url("${basePath}/images/biblical-sunset-over-unbroken-valley-1440.webp")`,
  "--media-background-image-2560": `url("${basePath}/images/biblical-sunset-over-unbroken-valley-2560.webp")`,
  "--media-background-image-mobile": `url("${basePath}/images/biblical-sunset-over-unbroken-valley-mobile-1600.webp")`,
} as CSSProperties & {
  "--media-background-image-1440": string;
  "--media-background-image-2560": string;
  "--media-background-image-mobile": string;
};

function subscribeToNavigation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}
function getSearch() { return window.location.search; }
function getServerSearch() { return ""; }
function getMediaKind(episode: Episode): MediaKind {
  return episode.orientation === "portrait" ? "stories" : "videos";
}

export function MediaExperience({ episodes: initialEpisodes }: { episodes: Episode[] }) {
  const search = useSyncExternalStore(subscribeToNavigation, getSearch, getServerSearch);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [playlistId, setPlaylistId] = useState("all");
  const [mediaKind, setMediaKind] = useState<MediaKind>("videos");
  const [discussion, setDiscussion] = useState<DiscussionKind>("comments");
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
  useEffect(() => {
    if (selectedEpisode) setMediaKind(getMediaKind(selectedEpisode));
  }, [selectedEpisode?.id]);

  const selectEpisode = (episode: Episode) => {
    setDiscussion("comments");
    window.history.pushState({}, "", episodeHref(window.location.href, episode.id));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const clearSelection = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("episode");
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const switchMediaKind = (nextKind: MediaKind) => {
    setMediaKind(nextKind);
    setPlaylistId("all");
    setDiscussion("comments");
    const nextEpisode = episodes.find((episode) => getMediaKind(episode) === nextKind);
    if (nextEpisode) selectEpisode(nextEpisode);
    else clearSelection();
  };

  const kindEpisodes = episodes.filter((episode) => getMediaKind(episode) === mediaKind);
  const kindEpisodeIds = new Set(kindEpisodes.map((episode) => episode.id));
  const kindPlaylists = playlists.filter((playlist) => playlist.episodeIds.some((id) => kindEpisodeIds.has(id)));
  const commentTitle = mediaKind === "stories" ? "Story comments" : "Video comments";

  return (
    <main id="main-content" className="media-page" style={mediaPageStyle}>
      <div className="page-width media-page-width">
        <header className="media-heading">
          <p className="media-kicker">FAITH · HOPE · STORY</p>
          <h1>Animated stories of faith.</h1>
          <p>Explore the life and teachings of Jesus through Scripture-inspired animation. Choose a full-length video or a portrait story, then follow its conversation. Watching and commenting are open to everyone.</p>
        </header>
        {catalogStatus === "loading" && episodes.length === 0 && <p className="catalog-notice" role="status">Loading the media library…</p>}
        {catalogStatus === "unconfigured" && episodes.length === 0 && <p className="catalog-notice" role="status">The public media library is being prepared. Please check back soon.</p>}
        {catalogStatus === "error" && <p className="catalog-notice is-error" role="status">The media library could not be reached. Please refresh to try again.</p>}

        <nav className="media-kind-tabs" aria-label="Choose a media collection">
          <button type="button" aria-pressed={mediaKind === "videos"} onClick={() => switchMediaKind("videos")}>
            <Film size={17} aria-hidden="true" /><span>Videos</span><small>{episodes.filter((episode) => getMediaKind(episode) === "videos").length}</small>
          </button>
          <button type="button" aria-pressed={mediaKind === "stories"} onClick={() => switchMediaKind("stories")}>
            <Smartphone size={17} aria-hidden="true" /><span>Stories</span><small>{episodes.filter((episode) => getMediaKind(episode) === "stories").length}</small>
          </button>
        </nav>

        <div className="media-layout">
          <div className="media-main">
            <VideoPlayer key={"player-" + (selectedEpisode?.id ?? "none")} episode={selectedEpisode} />
            <nav className="media-discussion-tabs" aria-label="Choose a discussion">
              <button type="button" aria-pressed={discussion === "comments"} disabled={!selectedEpisode}
                onClick={() => setDiscussion("comments")}>
                <MessageCircle size={16} aria-hidden="true" />{commentTitle}
              </button>
              <button type="button" aria-pressed={discussion === "community"}
                onClick={() => setDiscussion("community")}>
                <Users size={16} aria-hidden="true" />Media community
              </button>
            </nav>
            {discussion === "community"
              ? <CommentSection episode={null} general />
              : selectedEpisode
                ? <CommentSection key={"comments-" + selectedEpisode.id} episode={selectedEpisode} title={commentTitle} />
                : <p className="comment-status media-comment-prompt">Choose a {mediaKind === "stories" ? "story" : "video"} to open its comments, or join the Media community.</p>}
          </div>
          <EpisodePlaylist episodes={kindEpisodes} playlists={kindPlaylists} selectedPlaylistId={playlistId}
            onPlaylistChange={setPlaylistId} selectedId={selectedId} onSelect={selectEpisode} mediaKind={mediaKind} />
        </div>
      </div>
    </main>
  );
}
