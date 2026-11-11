import { withSupabase } from "npm:@supabase/server@1";

const DEFAULT_ORIGINS = [
  "https://mcographics.github.io",
  "https://kerygmapath.com",
  "https://www.kerygmapath.com",
  "http://localhost:3000",
];

function allowedOrigins(): Set<string> {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  return new Set(
    [...DEFAULT_ORIGINS, ...(configured ? configured.split(",") : [])]
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
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

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 8192) {
    return jsonResponse({ error: "invalid_request" }, 413);
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 8192) {
      return jsonResponse({ error: "invalid_request" }, 413);
    }
    payload = JSON.parse(body);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const input = payload as Record<string, unknown>;
  if (typeof input.website === "string" && input.website.trim()) {
    return jsonResponse({ status: "accepted" }, 202);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (input.consent !== true || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "invalid_signup" }, 400);
  }

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const rawListId = Deno.env.get("BREVO_LIST_ID");
  const rawTemplateId = Deno.env.get("BREVO_DOI_TEMPLATE_ID");
  const redirectUrl = Deno.env.get("BREVO_REDIRECT_URL");
  const listId = Number(rawListId);
  const templateId = Number(rawTemplateId);
  if (
    !apiKey
    || !Number.isSafeInteger(listId)
    || listId < 1
    || !Number.isSafeInteger(templateId)
    || templateId < 1
    || !redirectUrl
    || !/^https:\/\//i.test(redirectUrl)
  ) {
    return jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
  }

  const clientAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const fingerprintSecret = Deno.env.get("RATE_LIMIT_SALT");
  if (!clientAddress || !fingerprintSecret || fingerprintSecret.length < 32) {
    return jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
  }

  try {
    const fingerprintHash = await fingerprintAddress(clientAddress, fingerprintSecret);
    const { data, error } = await context.supabaseAdmin.rpc("check_newsletter_rate_limit", {
      p_fingerprint_hash: fingerprintHash,
    });
    if (error) {
      console.error("Newsletter rate-limit check failed", { code: error.code });
      return jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
    }
    if (data !== true) {
      return jsonResponse({ error: "rate_limited" }, 429);
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId,
        redirectionUrl: redirectUrl,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Brevo newsletter request failed", { status: response.status });
      return jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
    }

    return jsonResponse({ status: "confirmation_sent" }, 202);
  } catch {
    console.error("Newsletter provider request failed");
    return jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
  }
});

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigins().has(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403);

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const response = await authenticatedHandler(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    const response = jsonResponse({ error: "newsletter_temporarily_unavailable" }, 503);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
    return new Response(response.body, { status: response.status, headers });
  }
});
