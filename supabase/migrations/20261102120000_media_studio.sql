-- Admin-only media Studio with public, login-free video playback.
create table if not exists public.media_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.media_admins as admin
    where admin.user_id = auth.uid()
  );
$$;

revoke all on function public.is_media_admin() from public;
grant execute on function public.is_media_admin() to anon, authenticated;

create table if not exists public.media_episodes (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 5000),
  scripture_reference text,
  thumbnail_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  episode_number integer not null default 1 check (episode_number > 0),
  orientation text not null default 'landscape' check (orientation in ('landscape', 'portrait')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_video_sources (
  id uuid primary key default gen_random_uuid(),
  episode_id text not null references public.media_episodes(id) on delete cascade,
  quality text not null check (quality in ('720p', '1080p', '4K')),
  storage_path text not null unique,
  content_type text not null check (content_type in ('video/mp4', 'video/webm', 'video/quicktime')),
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  unique (episode_id, quality)
);

create table if not exists public.media_playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_playlist_items (
  playlist_id uuid not null references public.media_playlists(id) on delete cascade,
  episode_id text not null references public.media_episodes(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (playlist_id, episode_id)
);

create index if not exists media_episodes_public_order_idx
  on public.media_episodes (episode_number, created_at desc) where published;
create index if not exists media_playlist_items_order_idx
  on public.media_playlist_items (playlist_id, sort_order);

create or replace function public.set_media_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_episodes_updated_at on public.media_episodes;
create trigger media_episodes_updated_at
  before update on public.media_episodes
  for each row execute function public.set_media_updated_at();

drop trigger if exists media_playlists_updated_at on public.media_playlists;
create trigger media_playlists_updated_at
  before update on public.media_playlists
  for each row execute function public.set_media_updated_at();

-- Keep the comments allowlist in sync with the public media catalog.
create or replace function public.sync_published_episode_allowlist()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.published_episodes where id = old.id;
    return old;
  end if;

  insert into public.published_episodes (id, published)
  values (new.id, new.published)
  on conflict (id) do update set published = excluded.published;
  return new;
end;
$$;

drop trigger if exists media_episodes_sync_comments_allowlist on public.media_episodes;
create trigger media_episodes_sync_comments_allowlist
  after insert or update or delete on public.media_episodes
  for each row execute function public.sync_published_episode_allowlist();

alter table public.media_admins enable row level security;
alter table public.media_episodes enable row level security;
alter table public.media_video_sources enable row level security;
alter table public.media_playlists enable row level security;
alter table public.media_playlist_items enable row level security;

revoke all on table public.media_admins, public.media_episodes, public.media_video_sources,
  public.media_playlists, public.media_playlist_items from anon, authenticated;
grant select on table public.media_admins to authenticated;
grant select on table public.media_episodes, public.media_video_sources,
  public.media_playlists, public.media_playlist_items to anon, authenticated;
grant insert, update, delete on table public.media_episodes, public.media_video_sources,
  public.media_playlists, public.media_playlist_items to authenticated;

drop policy if exists "Admins can verify their own Studio access" on public.media_admins;
create policy "Admins can verify their own Studio access"
  on public.media_admins for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Visitors can read published episodes" on public.media_episodes;
create policy "Visitors can read published episodes"
  on public.media_episodes for select to anon, authenticated using (published);
drop policy if exists "Admins can manage episodes" on public.media_episodes;
create policy "Admins can manage episodes"
  on public.media_episodes for all to authenticated
  using (public.is_media_admin()) with check (public.is_media_admin());

drop policy if exists "Visitors can read sources for published episodes" on public.media_video_sources;
create policy "Visitors can read sources for published episodes"
  on public.media_video_sources for select to anon, authenticated
  using (exists (
    select 1 from public.media_episodes as episode
    where episode.id = media_video_sources.episode_id and episode.published
  ));
drop policy if exists "Admins can manage video sources" on public.media_video_sources;
create policy "Admins can manage video sources"
  on public.media_video_sources for all to authenticated
  using (public.is_media_admin()) with check (public.is_media_admin());

drop policy if exists "Visitors can read published playlists" on public.media_playlists;
create policy "Visitors can read published playlists"
  on public.media_playlists for select to anon, authenticated using (published);
drop policy if exists "Admins can manage playlists" on public.media_playlists;
create policy "Admins can manage playlists"
  on public.media_playlists for all to authenticated
  using (public.is_media_admin()) with check (public.is_media_admin());

drop policy if exists "Visitors can read published playlist items" on public.media_playlist_items;
create policy "Visitors can read published playlist items"
  on public.media_playlist_items for select to anon, authenticated
  using (
    exists (select 1 from public.media_playlists as playlist
      where playlist.id = media_playlist_items.playlist_id and playlist.published)
    and exists (select 1 from public.media_episodes as episode
      where episode.id = media_playlist_items.episode_id and episode.published)
  );
drop policy if exists "Admins can manage playlist items" on public.media_playlist_items;
create policy "Admins can manage playlist items"
  on public.media_playlist_items for all to authenticated
  using (public.is_media_admin()) with check (public.is_media_admin());

-- Published video files are private at rest. Visitors receive short-lived signed URLs
-- only for sources that belong to a published episode.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media-videos', 'media-videos', false, null, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set public = false, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors can sign published media videos" on storage.objects;
create policy "Visitors can sign published media videos"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'media-videos' and (
      public.is_media_admin()
      or exists (
        select 1
        from public.media_video_sources as source
        join public.media_episodes as episode on episode.id = source.episode_id
        where source.storage_path = storage.objects.name and episode.published
      )
    )
  );

drop policy if exists "Admins can upload media videos" on storage.objects;
create policy "Admins can upload media videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media-videos' and public.is_media_admin());

drop policy if exists "Admins can update media videos" on storage.objects;
create policy "Admins can update media videos"
  on storage.objects for update to authenticated
  using (bucket_id = 'media-videos' and public.is_media_admin())
  with check (bucket_id = 'media-videos' and public.is_media_admin());

drop policy if exists "Admins can delete media videos" on storage.objects;
create policy "Admins can delete media videos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media-videos' and public.is_media_admin());

-- Moderators can read pending/rejected comments and change only their status.
grant update (status) on public.episode_comments to authenticated;
drop policy if exists "Admins can review all comments" on public.episode_comments;
create policy "Admins can review all comments"
  on public.episode_comments for select to authenticated
  using (public.is_media_admin());
drop policy if exists "Admins can moderate comments" on public.episode_comments;
create policy "Admins can moderate comments"
  on public.episode_comments for update to authenticated
  using (public.is_media_admin())
  with check (public.is_media_admin());
