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

afterEach(() => window.history.replaceState({}, "", "/media/"));

describe("MediaExperience", () => {
  it("opens the requested story from a direct episode URL", () => {
    window.history.replaceState({}, "", "/media/?episode=hope-two");
    render(<MediaExperience episodes={episodes} />);
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();
    expect(screen.getByTitle("A Story of Hope")).toBeTruthy();
    expect(window.location.search).toBe("?episode=hope-two");
  });

  it("updates the shareable URL and responds to browser back/forward", () => {
    render(<MediaExperience episodes={episodes} />);
    fireEvent.click(screen.getByRole("button", { name: /A Story of Hope/ }));
    expect(window.location.search).toBe("?episode=hope-two");
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();

    window.history.replaceState({}, "", "/media/?episode=parable-one");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByRole("heading", { name: "A Story of Mercy" })).toBeTruthy();
  });
});
