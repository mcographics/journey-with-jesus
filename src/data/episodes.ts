export type VideoSource = { label: string; url: string };
export type MediaPlaylist = { id: string; title: string; description: string; sortOrder: number; episodeIds: string[] };
export type Episode = {
  id: string; title: string; description: string; scriptureReference?: string; thumbnail?: string;
  videoUrl?: string; videoSources?: VideoSource[]; youtubeId?: string; duration?: string;
  episodeNumber: number; orientation?: "landscape" | "portrait"; published: boolean;
};
export const episodes: Episode[] = [];
export function getPublishedEpisodes(allEpisodes: Episode[]): Episode[] {
  return allEpisodes.filter((episode) => episode.published).toSorted((a, b) => a.episodeNumber - b.episodeNumber);
}
