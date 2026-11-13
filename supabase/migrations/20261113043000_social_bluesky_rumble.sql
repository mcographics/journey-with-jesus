-- Support official Bluesky and Rumble social profiles.
-- Unpublished social entries may be saved before the profile URL is available.
alter table public.media_social_links
  drop constraint if exists media_social_links_platform_check;

alter table public.media_social_links
  add constraint media_social_links_platform_check
  check (platform = any (array[
    'youtube','facebook','instagram','tiktok','x',
    'linkedin','pinterest','twitch','discord','bluesky','rumble','custom'
  ]));

alter table public.media_social_links
  drop constraint if exists media_social_links_url_check;

alter table public.media_social_links
  add constraint media_social_links_url_check
  check (
    (not published and btrim(url) = '')
    or (url ~ '^https://' and char_length(url) <= 2048)
  );
