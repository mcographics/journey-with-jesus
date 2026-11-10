"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import type { Episode, MediaPlaylist } from "@/data/episodes";
import type { SiteLocale } from "@/data/site-translations";
import { episodeHref, resolveEpisodeId } from "@/lib/episode-navigation";
import { loadPublishedMediaCatalog } from "@/lib/media-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { CommentSection } from "@/components/CommentSection";
import { EpisodePlaylist } from "@/components/EpisodePlaylist";
import { VideoPlayer } from "@/components/VideoPlayer";

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
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [detectedOrientation, setDetectedOrientation] = useState<{ episodeId: string; orientation: "landscape" | "portrait" } | null>(null);
  const [measuredPlayer, setMeasuredPlayer] = useState<{ episodeId: string | null; width: number } | null>(null);
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

  useEffect(() => {
    const resetPlayerWidth = () => setMeasuredPlayer(null);
    window.addEventListener("resize", resetPlayerWidth);
    return () => window.removeEventListener("resize", resetPlayerWidth);
  }, []);

  const languageEpisodes = episodes.filter((episode) => (episode.audioLanguage ?? "en") === locale);
  const selectedId = resolveEpisodeId(search, languageEpisodes);
  const selectedEpisode = languageEpisodes.find((episode) => episode.id === selectedId) ?? null;
  const selectedEpisodeId = selectedEpisode?.id ?? null;
  const playerOrientation = detectedOrientation && detectedOrientation.episodeId === selectedEpisode?.id
    ? detectedOrientation.orientation
    : selectedEpisode?.orientation ?? "landscape";
  const measuredPlayerWidth = measuredPlayer?.episodeId === selectedEpisodeId ? measuredPlayer.width : null;
  const playerLayoutStyle = measuredPlayerWidth
    ? { "--media-player-width": `${measuredPlayerWidth}px` } as CSSProperties
    : undefined;
  const selectEpisode = (episode: Episode) => {
    setPlaylistOpen(false);
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

  return (
    <main id="main-content" className="media-page">
      <section className="media-stage" aria-label="Media library">
        <div className="page-width media-page-width">
          <h1 className="media-visually-hidden">Media library</h1>
          {catalogStatus === "unconfigured" && episodes.length === 0 && <p className="catalog-notice" role="status">The public media library is being prepared. Please check back soon.</p>}
          {catalogStatus === "error" && <p className="catalog-notice is-error" role="status">The media library could not be reached. Please refresh to try again.</p>}

          {catalogStatus === "ready" && languageEpisodes.length === 0 && (
            <p className="catalog-notice" role="status">No {localeName.toLowerCase()} media are available yet.</p>
          )}
          <div
            className={"media-layout" + (playerOrientation === "portrait" ? " is-portrait" : "") + (measuredPlayerWidth ? " has-player-width" : "")}
            style={playerLayoutStyle}
          >
            <div className="media-main">
              <VideoPlayer
                key={"player-" + (selectedEpisode?.id ?? "none")}
                episode={selectedEpisode}
                onFrameSizeChange={setMeasuredPlayer}
                onOrientationChange={(orientation) => {
                  if (selectedEpisode) setDetectedOrientation({ episodeId: selectedEpisode.id, orientation });
                }}
              />
              <button
                type="button"
                className="media-playlist-toggle"
                aria-expanded={playlistOpen}
                aria-controls="media-playlist"
                onClick={() => setPlaylistOpen((open) => !open)}
              >
                <span>{playlistOpen ? "Hide playlist" : "View playlist"}</span>
                <ChevronDown aria-hidden="true" size={18} />
              </button>
            </div>
            <EpisodePlaylist episodes={languageEpisodes} playlists={availablePlaylists} selectedPlaylistId={playlistId}
              onPlaylistChange={setPlaylistId} selectedId={selectedId} onSelect={selectEpisode}
              id="media-playlist" mobileCollapsed={!playlistOpen} />
          </div>
        </div>
      </section>

      <section className={"media-discussion page-width media-page-width" + (playerOrientation === "landscape" ? " is-landscape" : "")} aria-label="Media discussion">
        <CommentSection episode={null} general title="Comments" />
      </section>
    </main>
  );
}
