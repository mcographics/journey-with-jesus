"use client";
import { BookOpen, Play, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Episode, MediaPlaylist } from "@/data/episodes";

type Props = {
  episodes: Episode[]; selectedId: string | null; onSelect: (episode: Episode) => void;
  playlists?: MediaPlaylist[]; selectedPlaylistId?: string; onPlaylistChange?: (id: string) => void;
  id?: string; mobileCollapsed?: boolean;
};

export function EpisodePlaylist({ episodes, selectedId, onSelect, playlists = [], selectedPlaylistId = "all", onPlaylistChange, id, mobileCollapsed = false }: Props) {
  const [query, setQuery] = useState("");
  const [formatSelection, setFormatSelection] = useState<{ selectedId: string | null; format: "videos" | "shorts" | null }>(() => ({ selectedId, format: null }));
  const playlist = playlists.find((item) => item.id === selectedPlaylistId);
  const selectedEpisode = episodes.find((episode) => episode.id === selectedId);
  const selectedFormat = selectedEpisode?.orientation === "portrait" ? "shorts" : "videos";
  if (formatSelection.selectedId !== selectedId) setFormatSelection({ selectedId, format: null });
  const activeFormat = formatSelection.format ?? selectedFormat;
  const playlistEpisodes = useMemo(
    () => playlist ? episodes.filter((episode) => playlist.episodeIds.includes(episode.id)) : episodes,
    [episodes, playlist],
  );
  const formatEpisodes = useMemo(
    () => playlistEpisodes.filter((episode) => (episode.orientation === "portrait") === (activeFormat === "shorts")),
    [playlistEpisodes, activeFormat],
  );
  const visibleEpisodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return formatEpisodes;
    return formatEpisodes.filter((episode) => [episode.title, episode.description, episode.scriptureReference]
      .some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [formatEpisodes, query]);
  const formatLabel = activeFormat === "shorts"
    ? formatEpisodes.length === 1 ? "SHORT" : "SHORTS"
    : formatEpisodes.length === 1 ? "VIDEO" : "VIDEOS";
  const searchLabel = activeFormat === "shorts" ? "shorts" : "videos";

  return (
    <aside id={id} className="playlist-panel" aria-label="Media playlist" data-mobile-collapsed={mobileCollapsed ? "true" : undefined}>
      <div className="playlist-header">
        <div className="playlist-header-top">
          <h2>{playlist?.title ?? "Up next"}</h2>
          <span className="playlist-count">{formatEpisodes.length} {formatLabel}</span>
        </div>
        {playlists.length > 0 && onPlaylistChange && (
          <label className="playlist-picker">
            <span>Playlist</span>
            <select aria-label="Choose a media playlist" value={selectedPlaylistId} onChange={(event) => onPlaylistChange(event.target.value)}>
              <option value="all">All videos &amp; stories</option>
              {playlists.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        )}
        {playlist?.description && <p className="playlist-description">{playlist.description}</p>}
        {playlistEpisodes.length > 0 && (
          <>
            <div className="media-kind-tabs playlist-format-tabs" role="group" aria-label="Filter playlist by format">
              <button type="button" aria-pressed={activeFormat === "videos"} onClick={() => setFormatSelection({ selectedId, format: "videos" })}>
                Videos <small>16:9</small>
              </button>
              <button type="button" aria-pressed={activeFormat === "shorts"} onClick={() => setFormatSelection({ selectedId, format: "shorts" })}>
                Shorts <small>9:16</small>
              </button>
            </div>
            <label className="search-box">
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={`Search ${searchLabel}`} aria-label={`Search ${searchLabel}`} />
            </label>
          </>
        )}
      </div>
      {episodes.length === 0 ? (
        <div className="episode-empty">
          <BookOpen className="empty-icon" size={24} strokeWidth={1.4} aria-hidden="true" />
          <h3>Coming Soon</h3>
          <p>Videos and portrait stories will appear here as they are released.</p>
        </div>
      ) : playlistEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">This playlist has no videos or stories yet.</p>
      ) : formatEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">
          {activeFormat === "shorts" ? "No 9:16 Shorts" : "No 16:9 videos"} {playlist ? "in this playlist" : "available"} yet.
        </p>
      ) : visibleEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">No {searchLabel} match “{query}”.</p>
      ) : (
        <div className="playlist-list" aria-label={`Available ${searchLabel}`}>
          {visibleEpisodes.map((episode) => (
            <button type="button" key={episode.id} aria-current={selectedId === episode.id ? "true" : undefined}
              className={"episode-card" + (selectedId === episode.id ? " is-selected" : "")} onClick={() => onSelect(episode)}>
              <span className={"episode-art" + (episode.orientation === "portrait" ? " is-portrait" : "")} aria-hidden="true">
                {episode.thumbnail && <Image src={episode.thumbnail} alt="" fill sizes="(max-width: 520px) 88px, 106px" unoptimized />}
                <Play size={19} fill="currentColor" />
                {episode.duration && <span className="episode-duration">{episode.duration}</span>}
              </span>
              <span className="episode-copy">
                <strong>{episode.title}</strong>
                <small>{episode.scriptureReference ?? (episode.orientation === "portrait" ? "Portrait story" : "Video " + episode.episodeNumber)} · {episode.orientation === "portrait" ? "9:16" : "16:9"}</small>
                {selectedId === episode.id && <span className="episode-current-label">Now playing</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
