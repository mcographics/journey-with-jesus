-- Captions, transcripts, and optional interpreter-produced ASL links for published stories.
alter table public.media_episodes
  add column if not exists transcript_text text,
  add column if not exists asl_interpretation_url text;

alter table public.media_episodes
  drop constraint if exists media_episodes_transcript_text_length,
  add constraint media_episodes_transcript_text_length
    check (transcript_text is null or char_length(transcript_text) <= 100000),
  drop constraint if exists media_episodes_asl_url_https,
  add constraint media_episodes_asl_url_https
    check (asl_interpretation_url is null or asl_interpretation_url ~ '^https://');

create table if not exists public.media_captions (
  id uuid primary key default gen_random_uuid(),
  episode_id text not null references public.media_episodes(id) on delete cascade,
  language text not null check (language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  kind text not null default 'captions' check (kind in ('captions', 'subtitles')),
  storage_path text not null unique,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists media_captions_one_default_per_episode_idx
  on public.media_captions (episode_id) where is_default;
create unique index if not exists media_captions_episode_language_kind_idx
  on public.media_captions (episode_id, lower(language), kind);

alter table public.media_captions enable row level security;
revoke all on table public.media_captions from anon, authenticated;
grant select on table public.media_captions to anon, authenticated;
grant insert, update, delete on table public.media_captions to authenticated;

drop policy if exists "Visitors can read captions for published episodes" on public.media_captions;
create policy "Visitors can read captions for published episodes"
  on public.media_captions for select to anon, authenticated
  using (exists (
    select 1 from public.media_episodes as episode
    where episode.id = media_captions.episode_id and episode.published
  ));
drop policy if exists "Admins can manage episode captions" on public.media_captions;
create policy "Admins can manage episode captions"
  on public.media_captions for all to authenticated
  using (private.is_media_admin()) with check (private.is_media_admin());

-- Keep using the private media bucket; signed read URLs follow the published-episode policy.
update storage.buckets
set allowed_mime_types = array[
  'video/mp4', 'video/webm', 'video/quicktime', 'text/vtt'
]
where id = 'media-videos';

drop policy if exists "Visitors can sign published episode captions" on storage.objects;
create policy "Visitors can sign published episode captions"
  on storage.objects for select
  using (
    bucket_id = 'media-videos' and (
      private.is_media_admin()
      or exists (
        select 1
        from public.media_captions as caption
        join public.media_episodes as episode on episode.id = caption.episode_id
        where caption.storage_path = storage.objects.name and episode.published
      )
    )
  );
