"use client";

import { BookOpen, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Episode } from "@/data/episodes";

type EpisodePlaylistProps = {
  episodes: Episode[];
  selectedId: string | null;
  onSelect: (episode: Episode) => void;
};

export function EpisodePlaylist({ episodes, selectedId, onSelect }: EpisodePlaylistProps) {
  const [query, setQuery] = useState("");
  const visibleEpisodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return episodes;
    return episodes.filter((episode) => [episode.title, episode.description, episode.scriptureReference]
      .some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [episodes, query]);

  return (
    <aside className="playlist-panel" aria-label="Story playlist">
      <div className="playlist-header">
        <div className="playlist-header-top">
          <h2>Stories</h2>
          <span className="playlist-count">{episodes.length} {episodes.length === 1 ? "STORY" : "STORIES"}</span>
        </div>
        {episodes.length > 0 && (
          <label className="search-box">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search stories" aria-label="Search stories" />
          </label>
        )}
      </div>

      {episodes.length === 0 ? (
        <div className="episode-empty">
          <BookOpen className="empty-icon" size={24} strokeWidth={1.4} aria-hidden="true" />
          <h3>Coming Soon</h3>
          <p>Our first animated stories are being prepared. Check back as the library grows.</p>
        </div>
      ) : visibleEpisodes.length === 0 ? (
        <p className="episode-empty" role="status">No stories match “{query}”.</p>
      ) : (
        <div className="playlist-list" aria-label="Available stories">
          {visibleEpisodes.map((episode) => (
            <button
              type="button"
              key={episode.id}
              aria-current={selectedId === episode.id ? "true" : undefined}
              className={`episode-card${selectedId === episode.id ? " is-selected" : ""}`}
              onClick={() => onSelect(episode)}
            >
              <span className={`episode-art${episode.orientation === "portrait" ? " is-portrait" : ""}`} aria-hidden="true">
                <Play size={19} fill="currentColor" />
              </span>
              <span className="episode-copy">
                <strong>{episode.title}</strong>
                <small>{episode.scriptureReference ?? `Episode ${episode.episodeNumber}`} · {episode.orientation === "portrait" ? "9:16" : "16:9"}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
