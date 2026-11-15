import { withSupabase } from "npm:@supabase/server@1";

/** Public contact inbox delivery. The Resend API key and recipient stay server-side. */
const DEFAULT_ORIGINS = [
  "https://kerygmapath.com",
  "https://www.kerygmapath.com",
  "https://mcographics.github.io",
  "http://localhost:3000",
];

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",");
  return new Set([...DEFAULT_ORIGINS, ...configured].map((value) => value.trim()).filter(Boolean));
}

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function config() {
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const recipient = Deno.env.get("CONTACT_TO_EMAIL") ?? "";
  const sender = Deno.env.get("CONTACT_FROM_EMAIL") ?? "";
  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const ready = Deno.env.get("CONTACT_FORM_ENABLED") === "true"
    && apiKey.length > 12 && emailPattern.test(recipient)
    && emailPattern.test(sender) && salt.length >= 32;
  return { apiKey, recipient, sender, salt, ready };
}

async function hashAddress(address: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(address));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const handler = withSupabase({ auth: "publishable" }, async (request, context) => {
  const settings = config();
  if (request.method === "GET") return json({ ready: settings.ready });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!settings.ready) return json({ error: "service_unavailable" }, 503);

  const claimedLength = Number(request.headers.get("content-length") ?? 0);
  if (claimedLength > 8192) return json({ error: "invalid_request" }, 413);

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) return json({ error: "invalid_request" }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid_request" }, 400);
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  // Quietly absorb common bot submissions without emailing the studio.
  if (typeof input.website === "string" && input.website.trim()) return json({ status: "accepted" }, 202);

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

  if (input.consent !== true || name.length < 2 || name.length > 100
      || /[<>\x00-\x1f]/.test(name)
      || email.length > 254 || !emailPattern.test(email)
      || subject.length < 2 || subject.length > 150
      || /[<>\x00-\x1f]/.test(subject)
      || message.length < 10 || message.length > 4000
      || /\x00/.test(message)) {
    return json({ error: "invalid_message" }, 400);
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!clientIp) return json({ error: "service_unavailable" }, 503);

  try {
    const fingerprint = await hashAddress(clientIp, settings.salt);
    const { data: permitted, error } = await context.supabaseAdmin.rpc(
      "check_contact_rate_limit", { p_fingerprint_hash: fingerprint },
    );
    if (error) {
      console.error("Contact form rate limiter unavailable", { code: error.code });
      return json({ error: "service_unavailable" }, 503);
    }
    if (permitted !== true) return json({ error: "rate_limited" }, 429);

    const mail = [
      "New message from the Kerygma Path website",
      "",
      "Name: " + name,
      "Email: " + email,
      "Subject: " + subject,
      "",
      "Message:",
      message,
      "",
      "The sender consented to being contacted about this inquiry.",
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + settings.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: "Kerygma Path <" + settings.sender + ">",
        to: [settings.recipient],
        reply_to: email,
        subject: "[Kerygma Path Contact] " + subject,
        text: mail,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.error("Contact form email provider rejected request", { status: response.status });
      return json({ error: "service_unavailable" }, 503);
    }
    return json({ status: "accepted" }, 202);
  } catch {
    console.error("Contact form delivery unavailable");
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
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    const response = json({ error: "service_unavailable" }, 503);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  }
});
