-- Allow admins to attach an embeddable YouTube video to an episode.
alter table public.media_episodes add column if not exists youtube_id text;
alter table public.media_episodes drop constraint if exists media_episodes_youtube_id_format;
alter table public.media_episodes add constraint media_episodes_youtube_id_format
  check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$');
