-- Keep a moderated general Media discussion open before any episode is published.
-- Using the existing comment submission function preserves its validation,
-- rate limit, public approved-only reading, and admin moderation rules.
insert into public.published_episodes (id, published)
values ('media-community', true)
on conflict (id) do update set published = excluded.published;

-- Reserve this ID for community comments; no video can override its availability.
alter table public.media_episodes
  add constraint media_episodes_reserve_community_id
  check (id <> 'media-community');
