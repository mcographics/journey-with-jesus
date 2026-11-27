-- Journey with Jesus Art Gallery, admin-managed with private, watermarked assets.
create table if not exists public.art_gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 1200),
  category text not null default 'Artwork' check (char_length(btrim(category)) between 1 and 60),
  storage_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.art_gallery_settings (
  id text primary key check (id = 'default'),
  watermark_logo_path text not null default '/images/kerygma-path-logo.png',
  watermark_position text not null default 'bottom-right'
    check (watermark_position in ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
  watermark_opacity numeric not null default 0.78
    check (watermark_opacity between 0.35 and 1),
  watermark_scale numeric not null default 0.18
    check (watermark_scale between 0.08 and 0.34),
  updated_at timestamptz not null default now()
);

insert into public.art_gallery_settings (id)
values ('default')
on conflict (id) do nothing;

create index if not exists art_gallery_public_order_idx
  on public.art_gallery_images (sort_order, created_at desc)
  where published;

drop trigger if exists art_gallery_images_updated_at on public.art_gallery_images;
create trigger art_gallery_images_updated_at
  before update on public.art_gallery_images
  for each row execute function public.set_media_updated_at();

drop trigger if exists art_gallery_settings_updated_at on public.art_gallery_settings;
create trigger art_gallery_settings_updated_at
  before update on public.art_gallery_settings
  for each row execute function public.set_media_updated_at();

alter table public.art_gallery_images enable row level security;
alter table public.art_gallery_settings enable row level security;

revoke all on table public.art_gallery_images, public.art_gallery_settings from anon, authenticated;
grant select on table public.art_gallery_images to anon, authenticated;
grant insert, update, delete on table public.art_gallery_images to authenticated;
grant select, insert, update on table public.art_gallery_settings to authenticated;

drop policy if exists "Visitors can read published gallery artwork" on public.art_gallery_images;
create policy "Visitors can read published gallery artwork"
  on public.art_gallery_images for select to anon, authenticated
  using (published);

drop policy if exists "Admins can insert gallery artwork" on public.art_gallery_images;
create policy "Admins can insert gallery artwork"
  on public.art_gallery_images for insert to authenticated
  with check (private.is_media_admin() and (created_by is null or created_by = (select auth.uid())));

drop policy if exists "Admins can update gallery artwork" on public.art_gallery_images;
create policy "Admins can update gallery artwork"
  on public.art_gallery_images for update to authenticated
  using (private.is_media_admin())
  with check (private.is_media_admin());

drop policy if exists "Admins can delete gallery artwork" on public.art_gallery_images;
create policy "Admins can delete gallery artwork"
  on public.art_gallery_images for delete to authenticated
  using (private.is_media_admin());

drop policy if exists "Admins can manage gallery watermark settings" on public.art_gallery_settings;
create policy "Admins can manage gallery watermark settings"
  on public.art_gallery_settings for all to authenticated
  using (private.is_media_admin())
  with check (private.is_media_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journey-art-gallery', 'journey-art-gallery', false, 10485760, array['image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors can sign published art gallery images" on storage.objects;
create policy "Visitors can sign published art gallery images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'journey-art-gallery'
    and (
      private.is_media_admin()
      or exists (
        select 1 from public.art_gallery_images as artwork
        where artwork.storage_path = storage.objects.name
          and artwork.published
      )
    )
  );

drop policy if exists "Admins can upload art gallery assets" on storage.objects;
create policy "Admins can upload art gallery assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'journey-art-gallery'
    and private.is_media_admin()
    and (name like 'artwork/%' or name like 'branding/%')
  );

drop policy if exists "Admins can update art gallery assets" on storage.objects;
create policy "Admins can update art gallery assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'journey-art-gallery' and private.is_media_admin())
  with check (
    bucket_id = 'journey-art-gallery'
    and private.is_media_admin()
    and (name like 'artwork/%' or name like 'branding/%')
  );

drop policy if exists "Admins can delete art gallery assets" on storage.objects;
create policy "Admins can delete art gallery assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'journey-art-gallery' and private.is_media_admin());
