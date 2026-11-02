import type { Episode } from "@/data/episodes";

export function resolveEpisodeId(search: string, publishedEpisodes: Episode[]): string | null {
  if (publishedEpisodes.length === 0) return null;

  const requestedId = new URLSearchParams(search).get("episode");
  return publishedEpisodes.find((episode) => episode.id === requestedId)?.id
    ?? publishedEpisodes[0]?.id
    ?? null;
}

export function episodeHref(currentUrl: string, episodeId: string | null): string {
  const url = new URL(currentUrl, "https://journey-with-jesus.invalid");
  if (episodeId) url.searchParams.set("episode", episodeId);
  else url.searchParams.delete("episode");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function getDefaultVideoSource(episode: Episode) {
  return [...(episode.videoSources ?? [])].sort((a, b) => qualityValue(a.label) - qualityValue(b.label))[0]
    ?? (episode.videoUrl ? { label: "Original", url: episode.videoUrl } : null);
}

function qualityValue(label: string): number {
  const match = label.match(/(\d+(?:\.\d+)?)\s*(k|p)?/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "k" ? value * 1000 : value;
}
