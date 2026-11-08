-- Classify each published recording by its spoken audio, independent of source.
-- Existing uploads and YouTube embeds remain in the English catalog until an admin reclassifies them.
alter table public.media_episodes
  add column if not exists audio_language text not null default 'en';

alter table public.media_episodes
  drop constraint if exists media_episodes_audio_language_check;
alter table public.media_episodes
  add constraint media_episodes_audio_language_check
  check (audio_language in ('en', 'fr', 'es'));

create index if not exists media_episodes_published_audio_language_idx
  on public.media_episodes (audio_language, episode_number)
  where published;
