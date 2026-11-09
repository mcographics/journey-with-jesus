import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Episode } from "@/data/episodes";
import { MediaExperience } from "@/components/MediaExperience";

const episodes: Episode[] = [
  {
    id: "parable-one",
    title: "A Story of Mercy",
    description: "A test episode based on a parable.",
    scriptureReference: "Luke 10:25–37",
    episodeNumber: 1,
    published: true,
    orientation: "landscape",
    videoUrl: "https://media.example.test/mercy.mp4",
  },
  {
    id: "hope-two",
    title: "A Story of Hope",
    description: "Another test episode.",
    episodeNumber: 2,
    published: true,
    orientation: "portrait",
    youtubeId: "abc123xyz",
  },
];

afterEach(() => {
  window.history.replaceState({}, "", "/media/");
  window.localStorage.removeItem("kerygmapath-language");
});

describe("MediaExperience", () => {
  it("omits the large Media introduction while retaining an accessible page heading", () => {
    const { container } = render(<MediaExperience episodes={episodes} />);
    expect(container.querySelector(".media-heading")).toBeNull();
    expect(container.querySelector(".media-format-guide")).toBeNull();
    expect(container.querySelector(".media-visually-hidden")?.textContent).toBe("Media library");
    expect(container.querySelector(".media-layout")).toBeTruthy();
    expect(container.querySelector(".media-library-summary")).toBeNull();
    expect(screen.queryByText("All videos & stories")).toBeNull();
  });

  it("shows a single shared Comments section even when the library is empty", () => {
    render(<MediaExperience episodes={[]} />);
    expect(screen.queryByText("Loading the media library…")).toBeNull();
    expect(screen.getAllByRole("heading", { name: "Comments" })).toHaveLength(1);
    expect(screen.getAllByRole("region", { name: "Media discussion" })).toHaveLength(1);
    expect(screen.queryByRole("navigation", { name: "Choose a discussion" })).toBeNull();
    expect(screen.queryByText("Choose a story to see its community conversation.")).toBeNull();
  });

  it("keeps the same shared Comments section while switching videos and stories", () => {
    render(<MediaExperience episodes={episodes} />);
    const discussion = screen.getByRole("region", { name: "Media discussion" });
    const comments = discussion.querySelector(".comment-section");
    expect(comments).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Comments" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /A Story of Hope/ }));
    expect(discussion.querySelector(".comment-section")).toBe(comments);
    fireEvent.click(screen.getByRole("button", { name: /A Story of Mercy/ }));
    expect(discussion.querySelector(".comment-section")).toBe(comments);
    expect(screen.queryByRole("heading", { name: "Story comments" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Video comments" })).toBeNull();
  });

  it("opens the requested portrait story in the unified media player", () => {
    window.history.replaceState({}, "", "/media/?episode=hope-two");
    render(<MediaExperience episodes={episodes} />);
    expect(screen.getByRole("complementary", { name: "Media playlist" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /A Story of Mercy/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();
    expect(screen.getByTitle("A Story of Hope")).toBeTruthy();
    expect(window.location.search).toBe("?episode=hope-two");
  });

  it("updates the shareable URL and responds to browser back and forward", () => {
    render(<MediaExperience episodes={episodes} />);
    fireEvent.click(screen.getByRole("button", { name: /A Story of Hope/ }));
    expect(window.location.search).toBe("?episode=hope-two");
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();

    window.history.replaceState({}, "", "/media/?episode=parable-one");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByRole("heading", { name: "A Story of Mercy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /A Story of Hope/ })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Media playlist" })).toBeTruthy();
  });

  it("plays widescreen videos and portrait stories from the same playlist without switching tabs", () => {
    const { container } = render(<MediaExperience episodes={episodes} />);
    const playlist = screen.getByRole("complementary", { name: "Media playlist" });
    expect(playlist.textContent).toContain("A Story of Mercy");
    expect(playlist.textContent).toContain("A Story of Hope");
    expect(container.querySelector(".video-frame")?.classList.contains("is-portrait")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /A Story of Hope/ }));
    expect(container.querySelector(".video-frame")?.classList.contains("is-portrait")).toBe(true);
    expect(screen.getByTitle("A Story of Hope")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /A Story of Mercy/ }));
    expect(container.querySelector(".video-frame")?.classList.contains("is-portrait")).toBe(false);
    expect(screen.getByRole("heading", { name: "A Story of Mercy" })).toBeTruthy();
  });

  it("shows only media in the selected site audio language for both YouTube and uploads", () => {
    const localized: Episode[] = [
      { id: "en-upload", title: "English upload", description: "", episodeNumber: 1, published: true, orientation: "landscape", audioLanguage: "en", videoUrl: "https://media.example.test/en.mp4" },
      { id: "fr-youtube", title: "French YouTube", description: "", episodeNumber: 2, published: true, orientation: "landscape", audioLanguage: "fr", youtubeId: "abcdefghijk" },
      { id: "es-upload", title: "Spanish upload", description: "", episodeNumber: 3, published: true, orientation: "portrait", audioLanguage: "es", videoUrl: "https://media.example.test/es.mp4" },
    ];
    render(<MediaExperience episodes={localized} />);
    expect(screen.getByRole("heading", { name: "English upload" })).toBeTruthy();
    expect(screen.queryByText("French YouTube")).toBeNull();

    window.localStorage.setItem("kerygmapath-language", "fr");
    fireEvent(window, new Event("site-language-change"));
    expect(screen.getByRole("heading", { name: "French YouTube" })).toBeTruthy();
    expect(screen.queryByText("English upload")).toBeNull();
    expect(screen.getByRole("complementary", { name: "Media playlist" }).textContent).toContain("1 ITEM");

    window.localStorage.setItem("kerygmapath-language", "es");
    fireEvent(window, new Event("site-language-change"));
    expect(screen.getByRole("heading", { name: "Spanish upload" })).toBeTruthy();
    expect(screen.queryByText("French YouTube")).toBeNull();
    expect(screen.getByRole("complementary", { name: "Media playlist" }).textContent).toContain("1 ITEM");
  });

  it("never plays a recording from another language when a requested language has no media", () => {
    window.localStorage.setItem("kerygmapath-language", "fr");
    render(<MediaExperience episodes={episodes} />);
    expect(screen.queryByRole("heading", { name: "A Story of Mercy" })).toBeNull();
    expect(screen.getByText("No french media are available yet.")).toBeTruthy();
  });
});
