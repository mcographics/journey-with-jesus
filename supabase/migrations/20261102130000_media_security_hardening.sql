-- Keep internal authorization helpers outside the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_media_admin()
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

revoke all on function private.is_media_admin() from public;
grant execute on function private.is_media_admin() to anon, authenticated;

alter policy "Admins can manage episodes" on public.media_episodes
  using (private.is_media_admin()) with check (private.is_media_admin());
alter policy "Admins can manage video sources" on public.media_video_sources
  using (private.is_media_admin()) with check (private.is_media_admin());
alter policy "Admins can manage playlists" on public.media_playlists
  using (private.is_media_admin()) with check (private.is_media_admin());
alter policy "Admins can manage playlist items" on public.media_playlist_items
  using (private.is_media_admin()) with check (private.is_media_admin());
alter policy "Admins can review all comments" on public.episode_comments
  using (private.is_media_admin());
alter policy "Admins can moderate comments" on public.episode_comments
  using (private.is_media_admin()) with check (private.is_media_admin());

alter policy "Visitors can sign published media videos" on storage.objects
  using (
    bucket_id = 'media-videos' and (
      private.is_media_admin()
      or exists (
        select 1
        from public.media_video_sources as source
        join public.media_episodes as episode on episode.id = source.episode_id
        where source.storage_path = storage.objects.name and episode.published
      )
    )
  );
alter policy "Admins can upload media videos" on storage.objects
  with check (bucket_id = 'media-videos' and private.is_media_admin());
alter policy "Admins can update media videos" on storage.objects
  using (bucket_id = 'media-videos' and private.is_media_admin())
  with check (bucket_id = 'media-videos' and private.is_media_admin());
alter policy "Admins can delete media videos" on storage.objects
  using (bucket_id = 'media-videos' and private.is_media_admin());

alter policy "Admins can verify their own Studio access" on public.media_admins
  using (user_id = (select auth.uid()));

drop function public.is_media_admin();
revoke all on function public.sync_published_episode_allowlist() from public, anon, authenticated, service_role;

create index if not exists media_playlist_items_episode_playlist_idx
  on public.media_playlist_items (episode_id, playlist_id);
