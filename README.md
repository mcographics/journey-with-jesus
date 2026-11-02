# Journey with Jesus

An independently published, responsive Christian animation library site. It has two public destinations: Home and Media. The video catalog is managed by the owner in a private Studio; it starts empty until finished videos and approved artwork are added.

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

The Pages workflow includes the project's public Supabase URL and publishable key as build-time fallbacks. You can override them with repository **Actions variables** named `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These values are public by design; never place a secret or service-role key in the website.

## Media library and Studio

Visitors can browse videos and submit comments without signing in. Approved comments are public; new comments enter moderation. The public video library loads from Supabase so admins can publish, reorder playlists, and manage comments without a code change.

The private Studio lives at:

`https://mcographics.github.io/journey-with-jesus/studio`

It is not linked in the public header. Sign-in uses an email magic link, and database/storage policies check an explicit admin list. A hidden URL is not the access control.

### Connect the Supabase backend

The repository includes the media and comment database migrations. To make uploads, playback, playlists, and comments live:

1. The current Pages workflow is wired to the project's public Supabase URL and publishable key. You can override either value with the matching GitHub repository Actions variable. For local development, set both in `.env.local`.
2. Link the Supabase CLI to that project and apply the migrations with `supabase link --project-ref <project-ref>` and `supabase db push`.
3. Deploy the anonymous comment function with `supabase functions deploy submit-comment`. Set `RATE_LIMIT_SALT` to a random secret of at least 32 characters and set `ALLOWED_ORIGINS` to `https://mcographics.github.io` plus any exact local development origins.
4. In Supabase Auth, enable email sign-in, invite the owner's email, and add `https://mcographics.github.io/journey-with-jesus/studio` to the allowed redirect URLs. The Studio sign-in form only accepts an existing Auth user.
5. In the Supabase SQL editor, grant that invited account Studio access:
   `insert into public.media_admins (user_id) select id from auth.users where email = 'OWNER_EMAIL';`
   Replace `OWNER_EMAIL` with the invited admin's address. Repeat only for people who should manage videos and comments.
6. Re-run the GitHub Pages deployment workflow after changing the public Actions variables.

The comment function stores public submissions as pending, applies a one-minute per-address rate limit, and rejects direct anonymous inserts. Only approved comments can be read publicly. The Studio can approve or reject them. Never put a service-role key in the browser, repository, or Pages variables.

### Upload videos and make playlists

Create a story in Studio, save its details, then upload one or more prepared video files as 720p, 1080p, or 4K. Large uploads use resumable chunks. The player keeps landscape videos at 16:9 and portrait videos at 9:16, and shows a quality selector when multiple versions are available. Publish only after at least one video source has been uploaded. Add published stories to named playlists and publish those playlists to show them on the Media page.

Studio accepts MP4, WebM, and QuickTime files. It stores uploaded files in a private Supabase Storage bucket and serves public videos through time-limited signed URLs only while their story is published. This player does not transcode files: upload each prepared quality version you want visitors to choose. Supabase project storage, upload-size, bandwidth, and egress limits apply; choose limits and hosting capacity for the actual video sizes and audience.

## Project layout

- `src/app/` — Home and Media routes, global layout, metadata, styles, and favicon
- `src/components/` — responsive navigation, player, playlist, and comments UI
- `src/data/episodes.ts` — owner-managed published episode catalog
- `supabase/migrations/` — comment tables, RLS policies, and submission procedure
- `supabase/functions/submit-comment/` — validated, rate-limited pending-comment endpoint
- `.github/workflows/deploy-pages.yml` — checks and GitHub Pages deployment
