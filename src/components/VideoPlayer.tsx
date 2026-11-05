"use client";
import { Play, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Episode } from "@/data/episodes";
import { getDefaultVideoSource } from "@/lib/episode-navigation";

type VideoPlayerProps = { episode: Episode | null };
export function VideoPlayer({ episode }: VideoPlayerProps) {
  const [selectedUrl, setSelectedUrl] = useState(() => episode ? getDefaultVideoSource(episode)?.url ?? "" : "");
  const [selectedCaptionOverride, setSelectedCaptionOverride] = useState<string | null>(null);
  const selectedCaptionId = selectedCaptionOverride ?? episode?.captions?.find((caption) => caption.isDefault)?.id ?? episode?.captions?.[0]?.id ?? "off";
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    Array.from(tracks).forEach((track, index) => {
      track.mode = episode?.captions?.[index]?.id === selectedCaptionId ? "showing" : "disabled";
    });
  }, [episode?.captions, selectedCaptionId, selectedUrl]);

  if (!episode) return (
    <section className="video-player-section" aria-label="Video player"><div className="video-shell"><div className="video-frame">
      <div className="player-empty">
        <span className="player-symbol"><Play size={23} fill="currentColor" aria-hidden="true" /></span>
        <h2>Your next story awaits</h2><p>Choose a story from the library to begin watching. New animated journeys are on the way.</p>
      </div>
    </div></div></section>
  );

  const sources = episode.videoSources?.length
    ? [...episode.videoSources].sort((a, b) => qualityValue(a.label) - qualityValue(b.label))
    : episode.videoUrl ? [{ label: "Original", url: episode.videoUrl }] : [];
  const selectedSource = sources.find((source) => source.url === selectedUrl) ?? sources[0];
  const hasYoutube = Boolean(episode.youtubeId);
  const isPortrait = episode.orientation === "portrait";

  return (
    <section className="video-player-section" aria-label={"Video player for " + episode.title}>
      <div className="video-shell">
        <div className={"video-frame" + (isPortrait ? " is-portrait" : "")}>
          {hasYoutube ? (
            <iframe key={episode.youtubeId}
              src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(episode.youtubeId!) + "?rel=0&modestbranding=1&cc_load_policy=1"}
              title={episode.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          ) : selectedSource ? (
            <video key={episode.id + "-" + selectedSource.url} ref={videoRef} controls playsInline preload="metadata" aria-label={episode.title}>
              <source src={selectedSource.url} />
              {episode.captions?.map((caption) => (
                <track key={caption.id} kind={caption.kind} src={caption.url} srcLang={caption.language}
                  label={caption.label} default={caption.id === selectedCaptionId} />
              ))}
              Your browser does not support HTML video.
            </video>
          ) : (
            <div className="player-coming-soon">
              <span className="player-symbol"><Video size={24} aria-hidden="true" /></span>
              <h2>Coming soon</h2><p>This story has been announced, and its finished video will appear here when it is ready.</p>
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
            <label className="quality-control">Quality
              <select value={selectedSource?.url} onChange={(event) => setSelectedUrl(event.target.value)} aria-label="Video quality">
                {sources.map((source) => <option key={source.url} value={source.url}>{source.label}</option>)}
              </select>
            </label>
          )}
          {!hasYoutube && selectedSource && (episode.captions?.length ?? 0) > 0 && (
            <label className="caption-control">Captions
              <select aria-label="Captions" value={selectedCaptionId} onChange={(event) => setSelectedCaptionOverride(event.target.value)}>
                <option value="off">Off</option>
                {episode.captions!.map((caption) => <option key={caption.id} value={caption.id}>{caption.label}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
      <p className="episode-description">{episode.description}</p>
      <section className="episode-accessibility-resources" aria-label="Accessibility resources">
        <h3>Accessibility resources</h3>
        <p><strong>Captions:</strong> {hasYoutube
          ? "Captions are enabled automatically in the YouTube player when a caption track is available. Use the player’s CC controls to change or turn them off."
          : episode.captions?.length && selectedSource
            ? "Choose a caption track in the video controls or the Captions menu."
            : episode.captions?.length
              ? "Caption files are attached, but a direct video is not available yet."
              : "No caption file has been supplied for this story yet."}</p>
        {episode.transcript?.trim() ? (
          <details className="episode-transcript">
            <summary>Read transcript</summary>
            <div className="episode-transcript-body">{episode.transcript}</div>
            <a className="transcript-download" download={`${episode.id}-transcript.txt`}
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(episode.transcript)}`}>Download transcript</a>
          </details>
        ) : <p><strong>Transcript:</strong> No transcript has been supplied for this story yet.</p>}
        {episode.aslInterpretationUrl ? (
          <p><strong>ASL:</strong> <a href={episode.aslInterpretationUrl} target="_blank" rel="noreferrer">Watch the ASL interpretation video (opens in a new tab)</a></p>
        ) : <p><strong>ASL interpretation:</strong> No interpreter-produced ASL video has been supplied for this story yet.</p>}
      </section>
    </section>
  );
}
function qualityValue(label: string): number {
  const match = label.match(/(\d+(?:\.\d+)?)\s*(k|p)?/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "k" ? value * 1000 : value;
}
