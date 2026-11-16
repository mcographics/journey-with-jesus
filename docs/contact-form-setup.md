# Kerygma Path contact form setup

The Contact Us link exists only in the shared footer and points to `/contact/`.
The website is statically exported, so email is handled by the Supabase Edge Function
`contact-inquiry`. The form reports success only when the email provider accepts
the inquiry. Without an enabled and configured backend, the form is visibly unavailable
rather than pretending to send a message.

## One-time setup

1. Configure Resend, verify `kerygmapath.com` as a sender domain in Resend,
   and create an API key with email sending permission. The domain is registered
   with Hostinger; enter Resend's verification DNS records there.
2. In the Supabase Edge Function secrets for the Kerygma Path project set:
   - `RESEND_API_KEY`: secret API key; never add it to GitHub or a NEXT_PUBLIC_ variable.
   - `CONTACT_FROM_EMAIL`: verified address, e.g. `contact@kerygmapath.com`.
   - `CONTACT_TO_EMAIL`: the exact studio Gmail inbox specified by the site owner.
   - `RATE_LIMIT_SALT`: 32+ random characters, shared with other rate-limited functions if already set.
   - `CONTACT_FORM_ENABLED=true`: set only after confirming sender and recipient details.
3. Apply `supabase/migrations/20261115190000_contact_rate_limit.sql`.
4. Deploy `supabase/functions/contact-inquiry/index.ts` with JWT verification disabled:
   the function uses `withSupabase({ auth: "publishable" })` to verify the publishable key.
5. Check that `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present in the website build environment.
6. Test with a real inquiry; confirm it reaches the intended Gmail inbox,
   `Reply-To` is the visitor, validation rejects invalid fields,
   rate limits return 429, and the footer is the only site navigation to this page.

## Security and privacy

The endpoint checks the origin and publishable key, has a hidden anti-bot field,
input lengths and formats, HMAC-based IP rate limiting, and limits request size.
It does not store inquiry messages in the Supabase database. The recipient inbox
and Resend process the submitted personal details; disclose this in the privacy policy.
The public-facing page must not claim that email delivery works until a test confirms it.

## Deployment notes

The form inputs, consent checkbox, and Send Message button remain interactive even if
the Edge Function readiness check fails or times out. Visitors can compose a message
without being locked out. Submitting still requires valid fields and consent; if the
service is missing or unavailable, a clear error is shown and the text is preserved.
A success message appears only after the delivery endpoint returns HTTP 202.
If Resend credentials are not set, **do not mark the entire email-delivery feature
complete**.
