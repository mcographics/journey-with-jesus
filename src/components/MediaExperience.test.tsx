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
  it("opens Media community as a separate view when the library is empty", () => {
    render(<MediaExperience episodes={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Media community/ }));
    expect(screen.getByRole("heading", { name: "Media community" })).toBeTruthy();
    expect(screen.queryByText("Choose a story to see its community conversation.")).toBeNull();
  });

  it("keeps item comments separate from the Media community", () => {
    render(<MediaExperience episodes={episodes} />);
    fireEvent.click(screen.getByRole("button", { name: /A Story of Mercy/ }));
    expect(screen.getByRole("heading", { name: "Video comments" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Media community/ }));
    expect(screen.getByRole("heading", { name: "Media community" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Video comments" })).toBeNull();
  });

  it("opens the requested portrait story and selects the Stories collection", () => {
    window.history.replaceState({}, "", "/media/?episode=hope-two");
    render(<MediaExperience episodes={episodes} />);
    expect(screen.getByRole("button", { name: /Stories/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();
    expect(screen.getByTitle("A Story of Hope")).toBeTruthy();
    expect(window.location.search).toBe("?episode=hope-two");
  });

  it("updates the shareable URL and responds to browser back and forward", () => {
    render(<MediaExperience episodes={episodes} />);
    fireEvent.click(screen.getByRole("button", { name: /Stories/ }));
    fireEvent.click(screen.getByRole("button", { name: /A Story of Hope/ }));
    expect(window.location.search).toBe("?episode=hope-two");
    expect(screen.getByRole("heading", { name: "A Story of Hope" })).toBeTruthy();

    window.history.replaceState({}, "", "/media/?episode=parable-one");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByRole("heading", { name: "A Story of Mercy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Videos/ }).getAttribute("aria-pressed")).toBe("true");
  });
});
