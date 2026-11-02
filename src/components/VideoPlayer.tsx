"use client";

import { Play, Video } from "lucide-react";
import { useMemo, useState } from "react";
import type { Episode } from "@/data/episodes";
import { getDefaultVideoSource } from "@/lib/episode-navigation";

type VideoPlayerProps = { episode: Episode | null };

export function VideoPlayer({ episode }: VideoPlayerProps) {
  const initialSource = useMemo(() => episode ? getDefaultVideoSource(episode) : null, [episode]);
  const [selectedUrl, setSelectedUrl] = useState(initialSource?.url ?? "");

  if (!episode) {
    return (
      <div className="video-shell" aria-label="Video player">
        <div className="video-frame">
          <div className="player-empty">
            <span className="player-symbol"><Play size={23} fill="currentColor" aria-hidden="true" /></span>
            <h2>Your next story awaits</h2>
            <p>Choose a story from the library to begin watching. New animated journeys are on the way.</p>
          </div>
        </div>
      </div>
    );
  }

  const sources = episode.videoSources?.length
    ? [...episode.videoSources].sort((a, b) => qualityValue(a.label) - qualityValue(b.label))
    : episode.videoUrl ? [{ label: "Original", url: episode.videoUrl }] : [];
  const selectedSource = sources.find((source) => source.url === selectedUrl) ?? sources[0];
  const hasYoutube = Boolean(episode.youtubeId);
  const isPortrait = episode.orientation === "portrait";

  return (
    <section aria-label={`Video player for ${episode.title}`}>
      <div className="video-shell">
        <div className={`video-frame${isPortrait ? " is-portrait" : ""}`}>
          {hasYoutube ? (
            <iframe
              key={episode.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(episode.youtubeId!)}?rel=0&modestbranding=1`}
              title={episode.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : selectedSource ? (
            <video key={`${episode.id}-${selectedSource.url}`} controls playsInline preload="metadata" aria-label={episode.title}>
              <source src={selectedSource.url} />
              Your browser does not support HTML video.
            </video>
          ) : (
            <div className="player-coming-soon">
              <span className="player-symbol"><Video size={24} aria-hidden="true" /></span>
              <h2>Coming soon</h2>
              <p>This story has been announced, and its finished video will appear here when it is ready.</p>
            </div>
          )}
        </div>
        <div className="player-meta">
          <div>
            <h2 className="player-title">{episode.title}</h2>
            <p className="episode-meta">
              <span>Episode {episode.episodeNumber}</span>
              {episode.scriptureReference && <span>{episode.scriptureReference}</span>}
              <span>{isPortrait ? "9:16 Portrait" : "16:9 Landscape"}</span>
              {episode.duration && <span>{episode.duration}</span>}
            </p>
          </div>
          {!hasYoutube && sources.length > 1 && (
            <label className="quality-control">
              Quality
              <select value={selectedSource?.url} onChange={(event) => setSelectedUrl(event.target.value)} aria-label="Video quality">
                {sources.map((source) => <option key={source.url} value={source.url}>{source.label}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
      <p className="episode-description">{episode.description}</p>
    </section>
  );
}

function qualityValue(label: string): number {
  const match = label.match(/(\d+(?:\.\d+)?)\s*(k|p)?/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "k" ? value * 1000 : value;
}
