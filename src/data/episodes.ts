import type { MediaAudioLanguage } from "@/lib/database.types";
export type VideoSource = { label: string; url: string };
export type CaptionTrack = { id: string; label: string; language: string; kind: "captions" | "subtitles"; url: string; isDefault: boolean };
export type MediaPlaylist = { id: string; title: string; description: string; sortOrder: number; episodeIds: string[] };
export type Episode = {
  id: string; title: string; description: string; scriptureReference?: string; thumbnail?: string;
  videoUrl?: string; videoSources?: VideoSource[]; youtubeId?: string; audioLanguage?: MediaAudioLanguage; duration?: string;
  captions?: CaptionTrack[]; transcript?: string; aslInterpretationUrl?: string;
  episodeNumber: number; orientation?: "landscape" | "portrait"; published: boolean;
};
export const episodes: Episode[] = [];
export function getPublishedEpisodes(allEpisodes: Episode[]): Episode[] {
  return allEpisodes.filter((episode) => episode.published).toSorted((a, b) => a.episodeNumber - b.episodeNumber);
}
