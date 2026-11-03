-- Editable Meet the Team profiles for authenticated Upper Room administrators.
create table if not exists public.media_team_members (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  role text not null default '' check (char_length(role) <= 240),
  bio text not null default '' check (char_length(bio) <= 3000),
  profile_image_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_team_members_public_order_idx
  on public.media_team_members (sort_order, name) where published;

create trigger media_team_members_updated_at
  before update on public.media_team_members
  for each row execute function public.set_media_updated_at();

alter table public.media_team_members enable row level security;
revoke all on table public.media_team_members from anon, authenticated;
grant select on table public.media_team_members to anon, authenticated;
grant insert, update, delete on table public.media_team_members to authenticated;

create policy "Visitors can read published team members"
  on public.media_team_members for select to anon, authenticated
  using (published);
create policy "Admins can manage team members"
  on public.media_team_members for all to authenticated
  using (private.is_media_admin()) with check (private.is_media_admin());

insert into public.media_team_members (id, name, role, bio, sort_order, published)
values
  (
    'eric-oberhausen',
    'Eric Oberhausen',
    'Founder',
    'Eric Oberhausen is the founder of Journey with Jesus, an animated storytelling project sharing Scripture and the life of Jesus.',
    1,
    true
  ),
  (
    'kenneth-salmon',
    'Kenneth Salmon',
    'Editor / Webmaster',
    'Kenneth Salmon serves as Editor / Webmaster, editing site content and maintaining Journey with Jesus online.',
    2,
    true
  )
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-portraits',
  'team-portraits',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload team portraits" on storage.objects;
create policy "Admins can upload team portraits"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'team-portraits' and private.is_media_admin());

drop policy if exists "Admins can delete team portraits" on storage.objects;
create policy "Admins can delete team portraits"
  on storage.objects for delete to authenticated
  using (bucket_id = 'team-portraits' and private.is_media_admin());
