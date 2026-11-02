import { describe, expect, it } from "vitest";
import type { Episode } from "@/data/episodes";
import { episodeHref, getDefaultVideoSource, resolveEpisodeId } from "@/lib/episode-navigation";

const episodes: Episode[] = [
  { id: "first-story", title: "First Story", description: "A first story", episodeNumber: 1, published: true },
  { id: "second-story", title: "Second Story", description: "A second story", episodeNumber: 2, published: true },
];

describe("episode navigation", () => {
  it("opens an episode from a direct-link query and falls back to the first published episode", () => {
    expect(resolveEpisodeId("?episode=second-story", episodes)).toBe("second-story");
    expect(resolveEpisodeId("?episode=unknown", episodes)).toBe("first-story");
    expect(resolveEpisodeId("", [])).toBeNull();
  });

  it("preserves unrelated query parameters and the URL fragment when selecting a story", () => {
    expect(episodeHref("https://example.test/media/?filter=hope#comments", "first-story"))
      .toBe("/media/?filter=hope&episode=first-story#comments");
    expect(episodeHref("https://example.test/media/?episode=old", null)).toBe("/media/");
  });

  it("chooses the lowest supplied resolution as the default source", () => {
    const episode: Episode = {
      ...episodes[0]!,
      videoSources: [
        { label: "4K", url: "https://cdn.test/4k.mp4" },
        { label: "720p", url: "https://cdn.test/720.mp4" },
        { label: "1080p", url: "https://cdn.test/1080.mp4" },
      ],
    };
    expect(getDefaultVideoSource(episode)).toEqual({ label: "720p", url: "https://cdn.test/720.mp4" });
  });
});
