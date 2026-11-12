# Kerygma Path — Hostinger Reach custom newsletter

The footer has two modes:

1. **Fallback (currently live):** the official Hostinger Reach embed, form ID `46169614-b34a-4128-9bb0-2dc232611bbe`.
2. **Custom (when enabled):** a transparent, compact Kerygma Path form that submits to Supabase Edge Function `reach-newsletter-signup`, which forwards consented contacts to the Hostinger Reach public API.

The custom form only appears when the Edge Function's `GET` readiness response is `{ "ready": true }`. If the backend or credentials are unavailable, the website keeps showing the existing hosted form.

## Finish the secure setup

**Never commit a Hostinger API token to GitHub, put it in a `NEXT_PUBLIC_` environment variable, or paste it in a chat message.**

1. In **Hostinger Reach → Integrations → Reach public API**, follow the official setup guide. Create the API token in Hostinger hPanel → API.
2. Find the correct Reach **profile UUID** using the documented `GET /api/reach/v1/profiles` endpoint (the profile UUID is *not* the public embedded form ID).
3. In the existing **Supabase project `journey-with-jesus-media`**, open **Edge Functions → Secrets** and save:
   - `HOSTINGER_REACH_API_TOKEN` — the private Hostinger API token.
   - `HOSTINGER_REACH_PROFILE_ID` — Reach profile UUID for Kerygma Path.
   - `RATE_LIMIT_SALT` — required for the existing rate-limit RPC. Leave it unchanged if already configured; if missing, create a random secret of at least 32 characters.
   - Optional: `HOSTINGER_REACH_NEWSLETTER_TAG_UUIDS` — comma-separated existing tag UUIDs to attach to each new contact for segmentation.
4. Verify **Hostinger Reach → Settings → Double opt-in** is turned on if email confirmation is required. The Hostinger API supports automatic confirmation emails for new API contacts when double opt-in is enabled.
5. Finally save `HOSTINGER_REACH_NEWSLETTER_ENABLED=true` as a Supabase secret. This activates the custom form on the next page load. No further GitHub code change is needed.
6. Reload **https://kerygmapath.com/company/** and use a test email address you control. Confirm the on-screen status, that a new/pending contact appears in Reach, and that the confirmation email arrives. Test mobile and desktop layouts. If anything goes wrong, set `HOSTINGER_REACH_NEWSLETTER_ENABLED=false`; refreshing the site restores the hosted form.

## Technical notes

- The website only ever sees the **public Supabase publishable key**; the Hostinger API token stays in the Edge Function environment.
- The Edge Function validates address format, a required marketing consent checkbox, a bot honeypot, payload size, and an IP-based rate limit before contacting Hostinger.
- The custom form preserves Kerygma Path's privacy-policy link and reports success without claiming that confirmation was completed.
- The existing `newsletter-signup` Edge Function (Brevo) is left untouched.
- **Important:** adding contacts via Reach's public API is different from submitting the hosted Reach form. Form-specific submission analytics and any workflows triggered only by that particular form might not fire; use a Reach tag/segment and corresponding automation if that behaviour is needed.
- The separately requested branded thank-you redirect page is not part of this change.

Official references:
- https://www.hostinger.com/support/hostinger-reach-how-to-use-the-reach-public-api/
- https://www.hostinger.com/support/hostinger-reach-double-opt-in-explained-and-how-to-use-it/
- https://developers.hostinger.com/
