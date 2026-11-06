-- Let Journey Studio admins manage public social links shown in the site footer.
create table public.media_social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform = any (array[
    'youtube', 'facebook', 'instagram', 'tiktok', 'x', 'linkedin',
    'pinterest', 'twitch', 'discord', 'custom'
  ])),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  url text not null check (url ~ '^https://' and char_length(url) <= 2048),
  sort_order integer not null default 0 check (sort_order >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_social_links_public_order_idx
  on public.media_social_links (sort_order, label)
  where published;

create trigger media_social_links_updated_at
  before update on public.media_social_links
  for each row execute function public.set_media_updated_at();

alter table public.media_social_links enable row level security;
revoke all on table public.media_social_links from anon, authenticated;
grant select on table public.media_social_links to anon, authenticated;
grant insert, update, delete on table public.media_social_links to authenticated;

create policy "Visitors can read published social links"
  on public.media_social_links for select to anon, authenticated
  using (published);
create policy "Admins can manage social links"
  on public.media_social_links for all to authenticated
  using (private.is_media_admin()) with check (private.is_media_admin());

insert into public.media_social_links (platform, label, url, sort_order, published)
values
  ('youtube', 'YouTube', 'https://www.youtube.com/@KerygmaPath', 0, true),
  ('facebook', 'Facebook', 'https://www.facebook.com/KerygmaPath', 1, true);
