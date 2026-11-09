"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { Film, MessageCircle, Smartphone, Users } from "lucide-react";
import type { Episode, MediaPlaylist } from "@/data/episodes";
import type { SiteLocale } from "@/data/site-translations";
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
  "--media-background-image-1440": `url("${basePath}/images/media-page-background.webp")`,
  "--media-background-image-2560": `url("${basePath}/images/media-page-background.webp")`,
  "--media-background-image-mobile": `url("${basePath}/images/media-page-background.webp")`,
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
  const [locale, setLocale] = useState<SiteLocale>("en");
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [playlistId, setPlaylistId] = useState("all");
  const [mediaKind, setMediaKind] = useState<MediaKind>("stories");
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

  useEffect(() => {
    const updateLanguage = () => {
      try {
        const saved = window.localStorage.getItem("kerygmapath-language");
        setLocale(saved === "fr" || saved === "es" ? saved : "en");
      } catch {
        setLocale("en");
      }
    };
    updateLanguage();
    window.addEventListener("site-language-change", updateLanguage);
    window.addEventListener("storage", updateLanguage);
    return () => {
      window.removeEventListener("site-language-change", updateLanguage);
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  const languageEpisodes = episodes.filter((episode) => (episode.audioLanguage ?? "en") === locale);
  const selectedId = resolveEpisodeId(search, languageEpisodes);
  const selectedEpisode = languageEpisodes.find((episode) => episode.id === selectedId) ?? null;
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
    const nextEpisode = languageEpisodes.find((episode) => getMediaKind(episode) === nextKind);
    if (nextEpisode) selectEpisode(nextEpisode);
    else clearSelection();
  };

  const currentMediaKind = selectedEpisode ? getMediaKind(selectedEpisode) : mediaKind;
  const kindEpisodes = languageEpisodes.filter((episode) => getMediaKind(episode) === currentMediaKind);
  const kindEpisodeIds = new Set(kindEpisodes.map((episode) => episode.id));
  const kindPlaylists = playlists
    .map((playlist) => ({ ...playlist, episodeIds: playlist.episodeIds.filter((id) => kindEpisodeIds.has(id)) }))
    .filter((playlist) => playlist.episodeIds.length > 0);
  const localeName = locale === "fr" ? "French" : locale === "es" ? "Spanish" : "English";
  const commentTitle = currentMediaKind === "stories" ? "Story comments" : "Video comments";

  return (
    <main id="main-content" className="media-page" style={mediaPageStyle}>
      <section className="media-stage" aria-label="Media library">
        <div className="page-width media-page-width">
          <header className="media-heading">
            <p className="media-kicker">KERYGMAPATH · WATCH & DISCOVER</p>
            <h1>Media Library</h1>
            <p>Discover Scripture-inspired animation, teachings, and stories of faith. Choose a widescreen video or a vertical story, then join the conversation.</p>
            <div className="media-format-guide" aria-label="Supported video formats">
              <span>16:9 widescreen</span>
              <span>9:16 vertical</span>
              <span>4K playback when available</span>
            </div>
          </header>
          {catalogStatus === "loading" && episodes.length === 0 && <p className="catalog-notice" role="status">Loading the media library…</p>}
          {catalogStatus === "unconfigured" && episodes.length === 0 && <p className="catalog-notice" role="status">The public media library is being prepared. Please check back soon.</p>}
          {catalogStatus === "error" && <p className="catalog-notice is-error" role="status">The media library could not be reached. Please refresh to try again.</p>}

          <nav className="media-kind-tabs" aria-label="Choose a media collection">
            <button type="button" aria-pressed={currentMediaKind === "videos"} onClick={() => switchMediaKind("videos")}>
              <Film size={17} aria-hidden="true" /><span>Videos</span><small>{languageEpisodes.filter((episode) => getMediaKind(episode) === "videos").length}</small>
            </button>
            <button type="button" aria-pressed={currentMediaKind === "stories"} onClick={() => switchMediaKind("stories")}>
              <Smartphone size={17} aria-hidden="true" /><span>Stories</span><small>{languageEpisodes.filter((episode) => getMediaKind(episode) === "stories").length}</small>
            </button>
          </nav>

          {catalogStatus === "ready" && kindEpisodes.length === 0 && (
            <p className="catalog-notice" role="status">No {localeName.toLowerCase()} {currentMediaKind} are available yet.</p>
          )}
          <div className="media-layout">
            <div className="media-main">
              <VideoPlayer key={"player-" + (selectedEpisode?.id ?? "none")} episode={selectedEpisode} />
            </div>
            <EpisodePlaylist episodes={kindEpisodes} playlists={kindPlaylists} selectedPlaylistId={playlistId}
              onPlaylistChange={setPlaylistId} selectedId={selectedId} onSelect={selectEpisode} mediaKind={currentMediaKind} />
          </div>
        </div>
      </section>

      <section className="media-discussion page-width media-page-width" aria-label="Media discussion">
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
            : <p className="comment-status media-comment-prompt">Choose a {currentMediaKind === "stories" ? "story" : "video"} to open its comments, or join the Media community.</p>}
      </section>
    </main>
  );
}
