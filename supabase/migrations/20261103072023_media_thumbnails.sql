-- Public episode thumbnail files, writable only by Upper Room administrators.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-thumbnails',
  'media-thumbnails',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload media thumbnails" on storage.objects;
create policy "Admins can upload media thumbnails"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media-thumbnails' and private.is_media_admin());

drop policy if exists "Admins can delete media thumbnails" on storage.objects;
create policy "Admins can delete media thumbnails"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media-thumbnails' and private.is_media_admin());
