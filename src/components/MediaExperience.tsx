"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Film, MessageCircle, Users } from "lucide-react";
import type { Episode, MediaPlaylist } from "@/data/episodes";
import type { SiteLocale } from "@/data/site-translations";
import { episodeHref, resolveEpisodeId } from "@/lib/episode-navigation";
import { loadPublishedMediaCatalog } from "@/lib/media-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { CommentSection } from "@/components/CommentSection";
import { EpisodePlaylist } from "@/components/EpisodePlaylist";
import { VideoPlayer } from "@/components/VideoPlayer";

type DiscussionKind = "comments" | "community";
function subscribeToNavigation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}
function getSearch() { return window.location.search; }
function getServerSearch() { return ""; }

export function MediaExperience({ episodes: initialEpisodes }: { episodes: Episode[] }) {
  const search = useSyncExternalStore(subscribeToNavigation, getSearch, getServerSearch);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [locale, setLocale] = useState<SiteLocale>("en");
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [playlistId, setPlaylistId] = useState("all");
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
  const availableEpisodeIds = new Set(languageEpisodes.map((episode) => episode.id));
  const availablePlaylists = playlists
    .map((playlist) => ({
      ...playlist,
      episodeIds: playlist.episodeIds.filter((id) => availableEpisodeIds.has(id)),
    }))
    .filter((playlist) => playlist.episodeIds.length > 0);
  const localeName = locale === "fr" ? "French" : locale === "es" ? "Spanish" : "English";
  const commentTitle = selectedEpisode?.orientation === "portrait" ? "Story comments" : "Video comments";

  return (
    <main id="main-content" className="media-page">
      <section className="media-stage" aria-label="Media library">
        <div className="page-width media-page-width">
          <header className="media-heading">
            <p className="media-kicker">FAITH · HOPE · STORY</p>
            <h1>Animated stories of faith.</h1>
            <p>Explore the life and teachings of Jesus through Scripture-inspired animation. Choose a full-length video or a portrait story, then follow its conversation. Watching and commenting are open to everyone.</p>
          </header>
          <div className="media-format-guide" aria-label="Supported video formats">
            <span>16:9 widescreen</span>
            <span>9:16 vertical</span>
            <span>4K playback when available</span>
          </div>
          {catalogStatus === "loading" && episodes.length === 0 && <p className="catalog-notice" role="status">Loading the media library…</p>}
          {catalogStatus === "unconfigured" && episodes.length === 0 && <p className="catalog-notice" role="status">The public media library is being prepared. Please check back soon.</p>}
          {catalogStatus === "error" && <p className="catalog-notice is-error" role="status">The media library could not be reached. Please refresh to try again.</p>}

          <div className="media-library-summary" aria-label="Unified media library">
            <span className="media-library-summary-title"><Film size={17} aria-hidden="true" /> All videos &amp; stories</span>
            <span className="media-library-summary-count">{languageEpisodes.length} {languageEpisodes.length === 1 ? "title" : "titles"}</span>
          </div>
          {catalogStatus === "ready" && languageEpisodes.length === 0 && (
            <p className="catalog-notice" role="status">No {localeName.toLowerCase()} media are available yet.</p>
          )}
          <div className="media-layout">
            <div className="media-main">
              <VideoPlayer key={"player-" + (selectedEpisode?.id ?? "none")} episode={selectedEpisode} />
            </div>
            <EpisodePlaylist episodes={languageEpisodes} playlists={availablePlaylists} selectedPlaylistId={playlistId}
              onPlaylistChange={setPlaylistId} selectedId={selectedId} onSelect={selectEpisode} />
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
            : <p className="comment-status media-comment-prompt">Choose a video or story to open its comments, or join the Media community.</p>}
      </section>
    </main>
  );
}
