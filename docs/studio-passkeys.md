# Experimental Studio passkeys

The Studio uses Supabase Auth's **experimental passkey API** (`@supabase/supabase-js` v2.118.0, opt-in in `src/lib/supabase/browser.ts`). The JavaScript client performs a standards-based WebAuthn challenge and receives a normal Supabase session. **Passkeys do not replace the Studio's `media_admins` authorization check.** The existing Magic Link method remains available.

## Required one-time Supabase project setting

A dashboard owner must enable this server-side; enabling it in client code alone is insufficient.

1. Open the **journey-with-jesus-media** Supabase project (`mjsccbymabkmojjqdlsw`).
2. Go to **Authentication → Passkeys** and select **Enable Passkey authentication**.
3. Configure **Relying Party Display Name**: `Kerygma Creative HQ`.
4. Configure **Relying Party ID**: `kerygmapath.com` (no scheme or path).
5. Configure **Relying Party Origins**: `https://kerygmapath.com` (additional origins only if intentionally supported and matching this RP ID).
6. Save the configuration. Do **not** change the relying party ID after users register passkeys: existing passkeys will stop working.

Source: https://supabase.com/docs/guides/auth/passkeys

## Administrator enrollment

1. Sign in on `https://kerygmapath.com/studio/` using Magic Link with an approved, confirmed admin email.
2. In the authenticated Studio header, choose **Add passkey**.
3. Complete the browser or operating system security prompt.
4. Sign out. On the login selector, choose **Passkey → Sign in with passkey**.

Sign-in does not require an email because Supabase uses discoverable WebAuthn credentials. If the Supabase dashboard toggle is disabled, the app shows a specific setup message rather than pretending to sign in. If a browser does not support WebAuthn or the site is not in a secure context, the user can continue using Magic Link.

## Manual acceptance test

- With passkeys disabled on the backend, clicking **Sign in with passkey** explains the missing server configuration and allows returning to Magic Link.
- With the backend enabled, an authenticated admin can register a passkey, then sign out and authenticate with it.
- A valid passkey belonging to a non-admin must still show **Studio access is restricted**.
- Cancelled or failed WebAuthn prompts must not create a session; Magic Link remains usable.
- Verify a desktop and mobile browser on the production HTTPS origin.

This experimental feature remains dependent on Supabase's availability and its evolving API. Do not treat browser UI tests as proof of the actual device credential ceremony; the manual test is required.
