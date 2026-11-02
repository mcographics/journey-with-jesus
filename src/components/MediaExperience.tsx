"use client";

import { useSyncExternalStore } from "react";
import type { Episode } from "@/data/episodes";
import { episodeHref, resolveEpisodeId } from "@/lib/episode-navigation";
import { CommentSection } from "@/components/CommentSection";
import { EpisodePlaylist } from "@/components/EpisodePlaylist";
import { VideoPlayer } from "@/components/VideoPlayer";

function subscribeToNavigation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getSearch() {
  return window.location.search;
}

function getServerSearch() {
  return "";
}

export function MediaExperience({ episodes }: { episodes: Episode[] }) {
  const search = useSyncExternalStore(subscribeToNavigation, getSearch, getServerSearch);
  const selectedId = resolveEpisodeId(search, episodes);
  const selectedEpisode = episodes.find((episode) => episode.id === selectedId) ?? null;

  const selectEpisode = (episode: Episode) => {
    window.history.pushState({}, "", episodeHref(window.location.href, episode.id));
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <main id="main-content" className="media-page">
      <div className="page-width">
        <header className="media-heading">
          <p className="media-kicker">FAITH · HOPE · STORY</p>
          <h1>Animated stories of faith.</h1>
          <p>Explore the life and teachings of Jesus through Scripture-inspired animation. Each story is made to watch at your pace and in the format that fits your screen.</p>
        </header>

        <div className="media-layout">
          <div className="media-main">
            <VideoPlayer episode={selectedEpisode} />
            <CommentSection key={selectedEpisode?.id ?? "none"} episode={selectedEpisode} />
          </div>
          <EpisodePlaylist episodes={episodes} selectedId={selectedId} onSelect={selectEpisode} />
        </div>
      </div>
    </main>
  );
}
