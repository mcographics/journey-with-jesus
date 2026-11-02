# Journey with Jesus

An independently published, responsive Christian animation library site. It has two public destinations: Home and Media. The video catalog is intentionally empty until the owner supplies finished episodes and approved artwork.

## Stack and hosting

- Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide icons
- Next.js static export (`out/`) hosted by GitHub Pages
- Supabase Edge Function and Postgres for moderated comments when configured
- GitHub Actions checks lint, types, unit tests, browser tests, and builds before deployment

GitHub Pages serves static files and cannot run a Next.js server/API route. The comment submission endpoint therefore runs as a Supabase Edge Function. Until the owner configures Supabase, the UI clearly says comments are not set up; it does not pretend a submission was saved.

## Local development

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

For a local Supabase project, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are public client settings; never put a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable or the website repository.

## Deploy to GitHub Pages

The repository must use **Settings → Pages → Build and deployment → GitHub Actions**. A push to `main` runs the checks, exports the site with the project path `/journey-with-jesus`, and deploys the `out/` directory. The current project URL is:

`https://mcographics.github.io/journey-with-jesus/`

Optional repository **Actions variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If they are absent, comments remain visibly unavailable and the rest of the static site builds normally.

## Add an episode

Only publish completed, owner-approved videos and artwork. Add an entry to `src/data/episodes.ts` with a stable lowercase ID, title, accurate description, Scripture reference where applicable, episode number, orientation, and public HTTPS media source(s). Add an approved thumbnail only when the creator provides it. Keep unfinished stories out of the public catalog.

```ts
{
  id: "jesus-calms-the-storm",
  title: "Jesus Calms the Storm",
  description: "An animated retelling of Jesus calming the storm on the Sea of Galilee.",
  scriptureReference: "Mark 4:35–41",
  episodeNumber: 1,
  orientation: "landscape", // "portrait" uses 9:16
  published: true,
  videoSources: [
    { label: "720p", url: "https://media.example.com/story-720.mp4" },
    { label: "1080p", url: "https://media.example.com/story-1080.mp4" },
    { label: "4K", url: "https://media.example.com/story-4k.mp4" },
  ],
}
```

The player uses native HTML video controls and offers a quality selector when multiple files are available. Host full-resolution video with a video/CDN provider that supports HTTPS, byte-range seeking, and the intended audience/bandwidth; GitHub Pages is for the site, not large video masters. YouTube embeds are also supported with `youtubeId`. Confirm format, captions, rights, and playback on target devices before publishing a video.

When comments are enabled, also insert the episode ID into `public.published_episodes`. That allowlist prevents the public comment endpoint from accepting submissions for unpublished or unknown episodes.

## Set up moderated comments

1. Create or select the owner's Supabase project and install/use the Supabase CLI.
2. Link the project, then apply the migration: `supabase link --project-ref <project-ref>` and `supabase db push`.
3. Deploy the function: `supabase functions deploy submit-comment`.
4. Set function secrets: `supabase secrets set RATE_LIMIT_SALT="replace-with-a-random-secret-of-at-least-32-characters" ALLOWED_ORIGINS="https://mcographics.github.io,http://localhost:3000"`. Replace the sample salt, use the production site origin and any exact local origins needed, and keep the salt private.
5. In the database, add each published episode to `published_episodes`; review and approve comments using the Supabase dashboard or a restricted owner-only workflow.
6. Add the Supabase URL and **publishable** key as GitHub repository Actions variables. Re-run the deployment workflow.

The migration enables RLS, exposes only approved comments to anonymous readers, denies public direct inserts, and restricts comment submission to the service role used by the Edge Function. The function validates fields and origin, uses a honeypot, rate-limits per client address with an HMAC fingerprint, and stores submissions as `pending`. No user-facing admin interface is included, so moderation happens in the Supabase dashboard. Do not place a secret/service-role key in the browser or Pages build.

The SQL authorization checks are in `supabase/tests/comments_rls.test.sql`; run them against a local Supabase database with pgTAP before enabling the service. Local automated web tests do not prove a remote Supabase project is configured or live.

## Project layout

- `src/app/` — Home and Media routes, global layout, metadata, styles, and favicon
- `src/components/` — responsive navigation, player, playlist, and comments UI
- `src/data/episodes.ts` — owner-managed published episode catalog
- `supabase/migrations/` — comment tables, RLS policies, and submission procedure
- `supabase/functions/submit-comment/` — validated, rate-limited pending-comment endpoint
- `.github/workflows/deploy-pages.yml` — checks and GitHub Pages deployment
