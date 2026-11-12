import { withSupabase } from "npm:@supabase/server@1";

/** Public newsletter signup. Hostinger secrets are server-only.
 * Keep the existing hosted Reach form active until this endpoint reports ready.
 */
const DEFAULT_ORIGINS = [
  "https://kerygmapath.com",
  "https://www.kerygmapath.com",
  "https://mcographics.github.io",
  "http://localhost:3000",
];

function allowedOrigins(): Set<string> {
  const extra = Deno.env.get("ALLOWED_ORIGINS")?.split(",") ?? [];
  return new Set([...DEFAULT_ORIGINS, ...extra].map((value) => value.trim()).filter(Boolean));
}

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getConfiguration() {
  const apiToken = Deno.env.get("HOSTINGER_REACH_API_TOKEN") ?? "";
  const profileId = Deno.env.get("HOSTINGER_REACH_PROFILE_ID") ?? "";
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
  const enabled = Deno.env.get("HOSTINGER_REACH_NEWSLETTER_ENABLED") === "true";
  const ready = enabled
    && apiToken.length > 15
    && /^[a-f0-9-]{36}$/i.test(profileId)
    && salt.length >= 32;
  return { apiToken, profileId, salt, ready };
}

async function hashAddress(address: string, salt: string): Promise<string> {
  const text = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", text.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, text.encode(address));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const handler = withSupabase({ auth: "publishable" }, async (request, context) => {
  const config = getConfiguration();
  if (request.method === "GET") return json({ ready: config.ready });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!config.ready) return json({ error: "service_unavailable" }, 503);

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > 4096) return json({ error: "invalid_request" }, 413);

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 4096) {
      return json({ error: "invalid_request" }, 413);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "invalid_request" }, 400);
    }
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  // Bot trap: always return the same generic response without contacting Reach.
  if (typeof input.website === "string" && input.website.trim()) {
    return json({ status: "accepted" }, 202);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const firstName = typeof input.firstName === "string" ? input.firstName.trim() : "";
  if (input.consent !== true
    || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || firstName.length > 80
    || /[<>]/.test(firstName)) {
    return json({ error: "invalid_signup" }, 400);
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp) return json({ error: "service_unavailable" }, 503);

  try {
    const fingerprint = await hashAddress(clientIp, config.salt);
    const { data: permitted, error } = await context.supabaseAdmin.rpc(
      "check_newsletter_rate_limit", { p_fingerprint_hash: fingerprint },
    );
    if (error) {
      console.error("Reach signup rate-limit unavailable", { code: error.code });
      return json({ error: "service_unavailable" }, 503);
    }
    if (permitted !== true) return json({ error: "rate_limited" }, 429);

    const tagIds = (Deno.env.get("HOSTINGER_REACH_NEWSLETTER_TAG_UUIDS") ?? "")
      .split(",").map((value) => value.trim())
      .filter((value) => /^[a-f0-9-]{36}$/i.test(value));

    const response = await fetch(
      `https://developers.hostinger.com/api/reach/v1/profiles/${config.profileId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          ...(firstName ? { name: firstName } : {}),
          note: "Kerygma Path newsletter - website footer",
          ...(tagIds.length ? { tag_uuids: tagIds } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      console.error("Hostinger Reach request failed", { status: response.status });
      return json({ error: "service_unavailable" }, 503);
    }
    return json({ status: "accepted" }, 202);
  } catch {
    console.error("Hostinger Reach service unavailable");
    return json({ error: "service_unavailable" }, 503);
  }
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigins().has(origin)) return json({ error: "origin_not_allowed" }, 403);
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const response = await handler(request);
    const headers = new Headers(response.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
  } catch {
    const response = json({ error: "service_unavailable" }, 503);
    const headers = new Headers(response.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
  }
});
