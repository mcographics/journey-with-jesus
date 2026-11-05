import { describe, expect, it } from "vitest";
import { parseYouTubeId, youtubeWatchUrl } from "./youtube";

describe("YouTube link parsing", () => {
  const id = "dQw4w9WgXcQ";
  it("accepts common YouTube URL formats", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=" + id + "&t=12",
      "https://youtu.be/" + id + "?si=share",
      "https://youtube.com/shorts/" + id,
      "https://www.youtube.com/live/" + id,
      "https://www.youtube-nocookie.com/embed/" + id,
    ]) expect(parseYouTubeId(url)).toBe(id);
  });
  it("rejects unrelated hosts and invalid IDs", () => {
    for (const url of [
      "https://youtube.com.evil.example/watch?v=" + id,
      "https://example.com/watch?v=" + id,
      "javascript:alert(1)",
      "https://youtu.be/invalid",
      "https://www.youtube.com/playlist?list=" + id,
    ]) expect(parseYouTubeId(url)).toBeNull();
  });
  it("formats an editable watch link", () => {
    expect(youtubeWatchUrl(id)).toBe("https://www.youtube.com/watch?v=" + id);
  });
});
