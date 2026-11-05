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

  it("renders only supplied WebVTT tracks, selects the default, and provides transcript and ASL resources", () => {
    const item = {
      ...episode("landscape"),
      captions: [{
        id: "caption-en", label: "English captions", language: "en", kind: "captions" as const,
        url: "https://media.example.test/story-en.vtt", isDefault: true,
      }],
      transcript: "Narrator: The story begins.\nJesus: Peace be with you.",
      aslInterpretationUrl: "https://media.example.test/story-asl.mp4",
    };
    const { container } = render(<VideoPlayer episode={item} />);
    expect(container.querySelector("video")?.getAttribute("crossorigin")).toBe("anonymous");
    const track = container.querySelector("track");
    expect(track?.getAttribute("src")).toBe("https://media.example.test/story-en.vtt");
    expect(track?.getAttribute("srclang")).toBe("en");
    expect(track?.hasAttribute("default")).toBe(true);
    expect(screen.getByLabelText("Captions").textContent).toContain("English captions");
    fireEvent.click(screen.getByText("Read transcript"));
    expect(screen.getByText(/The story begins/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download transcript" }).getAttribute("download")).toBe("test-landscape-transcript.txt");
    expect(screen.getByRole("link", { name: /Watch the ASL interpretation video/ }).getAttribute("href")).toBe(item.aslInterpretationUrl);
  });

  it("does not invent captions, transcripts, or ASL for stories that have no supplied resources", () => {
    render(<VideoPlayer episode={episode("landscape")} />);
    expect(screen.getByText("No caption file has been supplied for this story yet.")).toBeTruthy();
    expect(screen.getByText("No transcript has been supplied for this story yet.")).toBeTruthy();
    expect(screen.getByText("No interpreter-produced ASL video has been supplied for this story yet.")).toBeTruthy();
    expect(screen.queryByLabelText("Captions")).toBeNull();
    expect(document.querySelector("track")).toBeNull();
  });
});
