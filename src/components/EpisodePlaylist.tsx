"use client";
import { BookOpen, Play, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Episode, MediaPlaylist } from "@/data/episodes";

type MediaKind = "videos" | "stories";
type Props = {
  episodes: Episode[]; selectedId: string | null; onSelect: (episode: Episode) => void;
  playlists?: MediaPlaylist[]; selectedPlaylistId?: string; onPlaylistChange?: (id: string) => void;
  mediaKind?: MediaKind;
};

export function EpisodePlaylist({ episodes, selectedId, onSelect, playlists = [], selectedPlaylistId = "all", onPlaylistChange, mediaKind = "stories" }: Props) {
  const [query, setQuery] = useState("");
  const isStories = mediaKind === "stories";
  const itemLabelPlural = isStories ? "stories" : "videos";
  const playlist = playlists.find((item) => item.id === selectedPlaylistId);
  const playlistEpisodes = useMemo(
    () => playlist ? episodes.filter((episode) => playlist.episodeIds.includes(episode.id)) : episodes,
    [episodes, playlist],
  );
  const visibleEpisodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return playlistEpisodes;
    return playlistEpisodes.filter((episode) => [episode.title, episode.description, episode.scriptureReference]
      .some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [playlistEpisodes, query]);

  return (
    <aside className="playlist-panel" aria-label={isStories ? "Story playlist" : "Video playlist"}>
      <div className="playlist-header">
        <div className="playlist-header-top">
          <h2>{playlist?.title ?? (isStories ? "Stories" : "Videos")}</h2>
          <span className="playlist-count">{playlistEpisodes.length} {itemLabelPlural.toUpperCase()}</span>
        </div>
        {playlists.length > 0 && onPlaylistChange && (
          <label className="playlist-picker">
            <span>Playlist</span>
            <select aria-label={isStories ? "Choose a story playlist" : "Choose a video playlist"} value={selectedPlaylistId} onChange={(event) => onPlaylistChange(event.target.value)}>
              <option value="all">All {itemLabelPlural}</option>
              {playlists.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        )}
        {playlist?.description && <p className="playlist-description">{playlist.description}</p>}
        {playlistEpisodes.length > 0 && (
          <label className="search-box">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={"Search " + itemLabelPlural} aria-label={"Search " + itemLabelPlural} />
          </label>
        )}
      </div>
      {episodes.length === 0 ? (
        <div className="episode-empty">
          <BookOpen className="empty-icon" size={24} strokeWidth={1.4} aria-hidden="true" />
          <h3>Coming Soon</h3>
          <p>{isStories ? "Portrait stories will appear here as they are released." : "Full-length videos will appear here as they are released."}</p>
        </div>
      ) : playlistEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">This playlist is ready for {itemLabelPlural}.</p>
      ) : visibleEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">No {itemLabelPlural} match “{query}”.</p>
      ) : (
        <div className="playlist-list" aria-label={"Available " + itemLabelPlural}>
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
                <small>{episode.scriptureReference ?? (isStories ? "Portrait story" : "Video " + episode.episodeNumber)} · {episode.orientation === "portrait" ? "9:16" : "16:9"}</small>
                {selectedId === episode.id && <span className="episode-current-label">Now playing</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
