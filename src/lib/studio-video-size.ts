/** Upload cap for the Journey Studio Supabase Free project (per file). */
export const FREE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function formatStudioFileSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function freePlanVideoSizeError(file: { name: string; size: number }): string | null {
  if (file.size <= FREE_VIDEO_MAX_BYTES) return null;
  return '"' + file.name + '" is ' + formatStudioFileSize(file.size) +
    ". Supabase Free has a 50 MB per-file limit. Export a smaller video in CapCut or use a YouTube link.";
}
