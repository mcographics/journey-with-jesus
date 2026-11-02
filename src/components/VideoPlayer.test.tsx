import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Episode } from "@/data/episodes";
import { VideoPlayer } from "@/components/VideoPlayer";

const sources = [
  { label: "4K", url: "https://media.example.test/story-4k.mp4" },
  { label: "720p", url: "https://media.example.test/story-720.mp4" },
  { label: "1080p", url: "https://media.example.test/story-1080.mp4" },
];

function episode(orientation: "portrait" | "landscape"): Episode {
  return {
    id: `test-${orientation}`,
    title: `Test ${orientation} story`,
    description: "Test description",
    episodeNumber: 1,
    orientation,
    published: true,
    videoSources: sources,
  };
}

describe("VideoPlayer", () => {
  it.each(["landscape", "portrait"] as const)("renders the %s video shape and quality choices", (orientation) => {
    const { container } = render(<VideoPlayer episode={episode(orientation)} />);
    const frame = container.querySelector(".video-frame");
    expect(frame?.classList.contains("is-portrait")).toBe(orientation === "portrait");
    expect(screen.getByLabelText("Video quality")).toBeTruthy();
    expect((container.querySelector("video source") as HTMLSourceElement).src).toBe(sources[1]!.url);
  });

  it("switches the native video source when the viewer chooses another quality", () => {
    const { container } = render(<VideoPlayer episode={episode("landscape")} />);
    fireEvent.change(screen.getByLabelText("Video quality"), { target: { value: sources[0]!.url } });
    expect((container.querySelector("video source") as HTMLSourceElement).src).toBe(sources[0]!.url);
  });

  it("shows the real empty-library state without inventing a video", () => {
    render(<VideoPlayer episode={null} />);
    expect(screen.getByRole("heading", { name: "Your next story awaits" })).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
  });
});
