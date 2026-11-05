import { describe, expect, it } from "vitest";
import { FREE_VIDEO_MAX_BYTES, formatStudioFileSize, freePlanVideoSizeError } from "./studio-video-size";

describe("Journey Studio Supabase Free file-size check", () => {
  it("allows files that are within the 50 MB per-file limit", () => {
    expect(freePlanVideoSizeError({ name: "capcut.mp4", size: 10 * 1024 * 1024 })).toBeNull();
    expect(freePlanVideoSizeError({ name: "capcut.mp4", size: FREE_VIDEO_MAX_BYTES })).toBeNull();
  });

  it("rejects anything larger and explains alternatives before uploading", () => {
    const message = freePlanVideoSizeError({ name: "capcut.mp4", size: FREE_VIDEO_MAX_BYTES + 1 });
    expect(message).toContain("capcut.mp4");
    expect(message).toContain("50 MB");
    expect(message).toContain("YouTube");
  });

  it("shows a readable size next to chosen files", () => {
    expect(formatStudioFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
