export type CommentPayload = {
  episodeId: string;
  displayName: string;
  body: string;
  honeypot: string;
};

export type ValidationResult =
  | { ok: true; value: CommentPayload }
  | { ok: false; message: string };

const EPISODE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCommentPayload(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, message: "The comment could not be read." };

  const episodeId = typeof value.episodeId === "string" ? value.episodeId.trim() : "";
  const displayName = typeof value.displayName === "string" ? value.displayName.normalize("NFC").trim() : "";
  const body = typeof value.body === "string"
    ? value.body.normalize("NFC").replace(/\r\n?/g, "\n").trim()
    : "";
  const honeypot = typeof value.website === "string" ? value.website.trim() : "";

  if (honeypot) return { ok: false, message: "This submission could not be accepted." };
  if (!EPISODE_ID_PATTERN.test(episodeId)) return { ok: false, message: "Choose an available episode." };
  if (displayName.length < 1 || Array.from(displayName).length > 60) {
    return { ok: false, message: "Use a display name between 1 and 60 characters." };
  }
  if (Array.from(body).length < 3 || Array.from(body).length > 2000) {
    return { ok: false, message: "Write a comment between 3 and 2,000 characters." };
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(body)) {
    return { ok: false, message: "The comment contains unsupported characters." };
  }

  return { ok: true, value: { episodeId, displayName, body, honeypot } };
}
