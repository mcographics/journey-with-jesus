export type StudioImageContentType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

const IMAGE_EXTENSIONS: Record<StudioImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const MAX_STUDIO_VIDEO_BYTES = 50 * 1024 * 1024; // Supabase Free project's maximum per-file size.

export function formatVideoFileSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
    : (bytes / 1024).toFixed(1) + " KB";
}

export function getVideoUploadError(file: { size: number }): string | null {
  if (file.size <= 0) return "The selected video file is empty.";
  if (file.size > MAX_STUDIO_VIDEO_BYTES) {
    return "This file is " + formatVideoFileSize(file.size)
      + ", above the 50 MB Supabase Free limit. Export a smaller video or upload it to YouTube and paste the link instead.";
  }
  return null;
}

export const MAX_STUDIO_IMAGE_BYTES = 10 * 1024 * 1024;

export function getImageUploadInfo(file: { type: string; size: number }): {
  contentType: StudioImageContentType;
  extension: string;
} {
  if (!Object.hasOwn(IMAGE_EXTENSIONS, file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
  }
  if (file.size <= 0) {
    throw new Error("The selected image file is empty.");
  }
  if (file.size > MAX_STUDIO_IMAGE_BYTES) {
    throw new Error("Choose an image up to 10 MB.");
  }

  const contentType = file.type as StudioImageContentType;
  return { contentType, extension: IMAGE_EXTENSIONS[contentType] };
}

export function getPublicStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const parsed = new URL(publicUrl);
    const marker = "/storage/v1/object/public/" + bucket + "/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length)) || null;
  } catch {
    return null;
  }
}

export function formatStudioError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; code?: unknown };
    if (typeof value.message === "string" && value.message.trim()) {
      const details = typeof value.details === "string" && value.details.trim() && !value.message.includes(value.details)
        ? " " + value.details.trim()
        : "";
      const code = typeof value.code === "string" && value.code.trim() ? " (" + value.code.trim() + ")" : "";
      return value.message.trim() + code + details;
    }
  }
  return fallback;
}
