import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const BUCKET = "media-videos";
const CHUNK_SIZE = 6 * 1024 * 1024;

export async function uploadVideoResumable(client: SupabaseClient<Database>, file: File, objectPath: string, onProgress: (percent: number) => void): Promise<void> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error("Your Studio session expired. Sign in again.");
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!apiKey || !projectUrl) throw new Error("Supabase Storage is not configured.");
  const parsed = new URL(projectUrl);
  const match = parsed.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/);
  const endpoint = (match ? "https://" + match[1] + ".storage.supabase.co" : parsed.origin) + "/storage/v1/upload/resumable";
  const authHeaders = { authorization: "Bearer " + data.session.access_token, apikey: apiKey };
  const metadata = [
    "bucketName " + btoa(BUCKET),
    "objectName " + btoa(objectPath),
    "contentType " + btoa(file.type || "video/mp4"),
    "cacheControl " + btoa("3600"),
  ].join(",");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { ...authHeaders, "Tus-Resumable": "1.0.0", "Upload-Length": String(file.size), "Upload-Metadata": metadata, "x-upsert": "false" },
  });
  if (!response.ok) throw new Error(await storageError(response));
  const location = response.headers.get("Location");
  if (!location) throw new Error("Storage did not return a resumable upload URL.");
  const uploadUrl = new URL(location, endpoint).toString();
  let offset = 0;
  let retries = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size));
    let next: Response;
    try {
      next = await fetch(uploadUrl, {
        method: "PATCH",
        headers: { ...authHeaders, "Tus-Resumable": "1.0.0", "Upload-Offset": String(offset), "Content-Type": "application/offset+octet-stream" },
        body: chunk,
      });
    } catch {
      retries += 1;
      if (retries > 5) throw new Error("The upload connection failed. Start this upload again.");
      await pause(retries * 700);
      offset = await readOffset(uploadUrl, authHeaders);
      continue;
    }
    if (!next.ok) {
      if (next.status >= 500 && retries < 5) {
        retries += 1;
        await pause(retries * 700);
        offset = await readOffset(uploadUrl, authHeaders);
        continue;
      }
      throw new Error(await storageError(next));
    }
    retries = 0;
    offset = Number(next.headers.get("Upload-Offset") ?? (offset + chunk.size));
    onProgress(Math.min(100, Math.round(offset / file.size * 100)));
  }
}

async function readOffset(url: string, headers: Record<string, string>): Promise<number> {
  const response = await fetch(url, { method: "HEAD", headers: { ...headers, "Tus-Resumable": "1.0.0" } });
  if (!response.ok) throw new Error("Storage could not resume the upload.");
  return Number(response.headers.get("Upload-Offset") ?? 0);
}
async function storageError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {}
  return body || "Storage rejected the upload.";
}
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
