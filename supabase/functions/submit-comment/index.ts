import { withSupabase } from "npm:@supabase/server@1";
import { validateCommentPayload } from "../_shared/validation.ts";
import { screenComment } from "../_shared/moderation.ts";

const DEFAULT_ORIGINS = ["https://mcographics.github.io", "http://localhost:3000"];

function allowedOrigins(): Set<string> {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  return new Set([...DEFAULT_ORIGINS, ...(configured ? configured.split(",") : [])].map((origin) => origin.trim()).filter(Boolean));
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function fingerprintAddress(address: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(address));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const authenticatedHandler = withSupabase({ auth: "publishable" }, async (request, context) => {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const validation = validateCommentPayload(payload);
  if (!validation.ok) return jsonResponse({ error: validation.message }, 400);

  const moderation = screenComment(validation.value.body);
  if (moderation.action === "reject") {
    return jsonResponse({ error: "comment_rejected", message: "This comment does not meet our community guidelines." }, 422);
  }

  const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const fingerprintSecret = Deno.env.get("RATE_LIMIT_SALT");
  if (!clientAddress || !fingerprintSecret || fingerprintSecret.length < 32) {
    return jsonResponse({ error: "comments_temporarily_unavailable" }, 503);
  }

  const fingerprintHash = await fingerprintAddress(clientAddress, fingerprintSecret);
  const { data, error } = await context.supabaseAdmin.rpc("submit_episode_comment", {
    p_episode_id: validation.value.episodeId,
    p_display_name: validation.value.displayName,
    p_body: validation.value.body,
    p_fingerprint_hash: fingerprintHash,
  });

  if (error) {
    if (error.message.includes("comment_rate_limited")) {
      return jsonResponse({ error: "rate_limited", message: "Please wait a minute before commenting again." }, 429);
    }
    if (error.message.includes("episode_not_available")) {
      return jsonResponse({ error: "episode_not_available" }, 404);
    }
    if (error.code === "22023") return jsonResponse({ error: "invalid_comment" }, 400);
    console.error("Comment submission failed", { code: error.code });
    return jsonResponse({ error: "comments_temporarily_unavailable" }, 503);
  }

  const comment = Array.isArray(data) ? data[0] : data;
  if (!comment || comment.status !== "pending") {
    return jsonResponse({ error: "comments_temporarily_unavailable" }, 503);
  }

  return jsonResponse({ status: "pending", createdAt: comment.created_at }, 202);
});

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedOrigins();
  if (!allowed.has(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403);

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const response = await authenticatedHandler(request);
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
});
