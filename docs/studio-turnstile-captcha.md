# Supabase Auth bot and abuse protection — Kerygma Path

## Deployment order (important)

Kerygma Creative HQ uses Cloudflare Turnstile on the **Magic Link** form, when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is configured. The form supplies the token to `supabase.auth.signInWithOtp` and resets the CAPTCHA after use.

1. In your Cloudflare dashboard, create a **Turnstile** widget with the permitted hostname `kerygmapath.com`. Copy the **public Site Key** and **private Secret Key**.
2. Put the public Site Key in the GitHub repository **Settings → Secrets and variables → Actions → Variables** as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. A repository variable is appropriate; the public key is intentionally visible to browsers.
3. Trigger the GitHub Pages deploy from the `main` branch and verify that a human-verification widget appears at https://kerygmapath.com/studio/ under Magic Link.
4. Open [Supabase Authentication → Bot and Abuse Protection](https://supabase.com/dashboard/project/mjsccbymabkmojjqdlsw/auth/protection), enable CAPTCHA, choose **Cloudflare Turnstile**, enter the **private Secret Key** and save. Do not expose the Secret Key in a `NEXT_PUBLIC_` variable or commit it into GitHub.
5. Verify that a real Magic Link request succeeds with a valid Turnstile challenge; an invalid/expired challenge should be rejected. Confirm that Magic Link, passkeys and the second-factor Microsoft Authenticator flow still work.

**Do not enable Supabase's CAPTCHA switch before the production site includes the matching site key.** Otherwise Magic Link can be accidentally blocked.

## Scope

This change covers the Supabase **Auth** Magic Link endpoint only. Cloudflare Turnstile is not a substitute for Supabase rate limits, authorization/RLS, or independent bot mitigation on public comment/newsletter/contact endpoints. Those endpoints require their own server-side abuse protections if subjected to traffic abuse.

Microsoft Authenticator is separate, already implemented using Supabase TOTP in PR #69. Administrators enable it after their initial sign-in.
