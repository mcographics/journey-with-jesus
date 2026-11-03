import { describe, expect, it } from "vitest";
import { formatStudioError, getImageUploadInfo, getPublicStoragePath, MAX_STUDIO_IMAGE_BYTES } from "@/lib/supabase/studio-upload";

describe("Studio upload helpers", () => {
  it("accepts supported image formats and assigns a safe extension", () => {
    expect(getImageUploadInfo({ type: "image/jpeg", size: 1024 })).toEqual({ contentType: "image/jpeg", extension: "jpg" });
    expect(getImageUploadInfo({ type: "image/avif", size: 1024 })).toEqual({ contentType: "image/avif", extension: "avif" });
  });

  it("rejects empty, unsupported, and oversized image files", () => {
    expect(() => getImageUploadInfo({ type: "image/png", size: 0 })).toThrow("empty");
    expect(() => getImageUploadInfo({ type: "image/gif", size: 1024 })).toThrow("JPEG, PNG, WebP, or AVIF");
    expect(() => getImageUploadInfo({ type: "image/png", size: MAX_STUDIO_IMAGE_BYTES + 1 })).toThrow("up to 10 MB");
  });

  it("extracts only paths from the expected public bucket URL", () => {
    expect(getPublicStoragePath("https://example.supabase.co/storage/v1/object/public/media-thumbnails/episode-1/image%20one.png", "media-thumbnails"))
      .toBe("episode-1/image one.png");
    expect(getPublicStoragePath("https://images.example.com/image.png", "media-thumbnails")).toBeNull();
  });

  it("shows useful structured Supabase errors", () => {
    expect(formatStudioError({ message: "row denied", code: "42501", details: "admin access required" }, "save failed"))
      .toBe("row denied (42501) admin access required");
  });
});
