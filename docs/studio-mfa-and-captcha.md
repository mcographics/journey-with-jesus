# Kerygma Creative HQ: Microsoft Authenticator and bot protection

## Microsoft Authenticator (TOTP)

Supabase Auth provides TOTP MFA directly. **Do not set up an OAuth server.**

1. Sign in at https://kerygmapath.com/studio/ by Magic Link or passkey.
2. In the Studio header choose **Microsoft Authenticator**, then **Set up Microsoft Authenticator**.
3. On your phone choose **Microsoft Authenticator → Add account → Other account** and scan the QR code. Alternatively enter the displayed secret manually. Never email or share the QR/secret.
4. Enter the six-digit code in Studio and choose **Verify and enable**.
5. On future sign-ins, after the initial sign-in, Studio presents the six-digit code challenge. Once enrolled, the private.is_media_admin() database policy also requires an **aal2** session for administrator operations, so hiding the browser UI does not bypass MFA.
6. Enrol a second authenticator for recovery when supported and keep backup secrets secure. Supabase does not issue TOTP recovery codes.

Magic Links and passkeys remain first-factor sign-in choices. Microsoft Authenticator is an additional factor, not a stand-alone login.

## Cloudflare Turnstile CAPTCHA

Supabase Auth supports Cloudflare Turnstile (or hCaptcha) under **Authentication → Bot and Abuse Protection**. The Studio uses **Cloudflare Turnstile** on its Magic Link form only when a public site key is configured.

**Two provider values are required; neither can be invented:**

1. In your Cloudflare dashboard, visit **Turnstile → Add widget** and add hostname `kerygmapath.com` (and `www.kerygmapath.com` only if visitors actually sign in there). Copy the widget's **Site Key** and **Secret Key**.
2. Add the public **Site Key** to the GitHub repository Actions variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Do not put the secret here; the key is intentionally public.
3. Deploy the website and confirm the Turnstile widget appears on the Magic Link form. It should disable submission until the visitor completes the challenge. A successful challenge token is sent with Supabase `signInWithOtp`, and the widget resets after each attempt.
4. In the **Supabase project** dashboard open [Authentication → Bot and Abuse Protection](https://supabase.com/dashboard/project/mjsccbymabkmojjqdlsw/auth/protection), enable CAPTCHA protection, choose **Cloudflare Turnstile**, enter the **Secret Key** into the secure server-side field, and save.
5. Test a real Magic Link request, a missing/expired CAPTCHA, throttling, and a second login. Existing passkey sign-in should remain available. Check whether CAPTCHA is also imposed on any additional Supabase-auth forms and add an appropriate widget to each such form before enforcing it.

**Do not enable Supabase's server-side CAPTCHA toggle before the website has a working matching public site key**, or legitimate Magic Link login may fail. The secret key must never go into GitHub, browser code, screenshots, or chat.

Turnstile protects the public email sign-in request. Supabase's rate limits and existing database Row-Level Security remain complementary protections. CAPTCHA by itself does not protect data APIs or application Edge Functions.

## Security and rollout checks

- Confirm the authentication redirect allow list includes `https://kerygmapath.com/studio/`.
- Verify Studio allows only accounts explicitly listed in `public.media_admins`.
- Enrol TOTP with a real authenticator (the QR/secret is unique per user); confirm the first factor still works.
- Verify MFA challenge on sign-in and that bypassing its UI cannot read or modify administrator-only content with an `aal1` session.
- Verify no logged-in user without Studio admin membership can access the Studio after successfully completing MFA.
- Verify the live site (not only GitHub CI) before marking the work complete.
