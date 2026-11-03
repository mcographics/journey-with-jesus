-- Editable Meet the Characters dossiers for the existing Upper Room admins.
create table if not exists public.media_characters (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  role text not null default '' check (char_length(role) <= 240),
  summary text not null default '' check (char_length(summary) <= 3000),
  scripture_references text not null default '' check (char_length(scripture_references) <= 500),
  portrait_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_characters_public_order_idx
  on public.media_characters (sort_order, name) where published;

create trigger media_characters_updated_at
  before update on public.media_characters
  for each row execute function public.set_media_updated_at();

alter table public.media_characters enable row level security;
revoke all on table public.media_characters from anon, authenticated;
grant select on table public.media_characters to anon, authenticated;
grant insert, update, delete on table public.media_characters to authenticated;

create policy "Visitors can read published characters"
  on public.media_characters for select to anon, authenticated
  using (published);
create policy "Admins can manage characters"
  on public.media_characters for all to authenticated
  using (private.is_media_admin()) with check (private.is_media_admin());

insert into public.media_characters
  (id, name, role, summary, scripture_references, sort_order, published)
values
  ('jesus-of-nazareth', 'Jesus of Nazareth', 'The centre of the Gospel story', 'Follow Jesus through His teaching, miracles, compassion, death, and resurrection in the four Gospel accounts.', 'Matthew 1–28 · Mark 1–16 · Luke 1–24 · John 1–21', 1, true),
  ('mary-mother-of-jesus', 'Mary, Mother of Jesus', 'A faithful presence in Jesus’ life', 'The Gospels introduce Mary at Jesus’ birth and show her trust, courage, and presence with the disciples.', 'Matthew 1–2 · Luke 1–2 · John 2:1–12; 19:25–27 · Acts 1:14', 2, true),
  ('simon-peter', 'Simon Peter', 'A fisherman and disciple', 'Peter’s journey includes bold declarations, painful failures, restoration, and a leading role among the early disciples.', 'Matthew 4:18–20; 16:13–19 · Luke 22:54–62 · John 21 · Acts 1–12', 3, true),
  ('john-the-baptist', 'John the Baptist', 'The voice preparing the way', 'John calls people to repentance, baptizes Jesus, and points others toward the one whose arrival he announces.', 'Matthew 3 · Mark 1:1–11 · Luke 1; 3 · John 1:19–34', 4, true),
  ('mary-magdalene', 'Mary Magdalene', 'A witness to the resurrection', 'Mary Magdalene follows Jesus, remains near the cross, and is among the first witnesses to the empty tomb.', 'Luke 8:1–3 · John 19:25 · John 20:1–18', 5, true),
  ('beloved-disciple', 'The Beloved Disciple', 'A witness in John’s Gospel', 'John’s Gospel uses this title for a close disciple who appears at key moments in Jesus’ final days and resurrection story.', 'John 13:23 · 19:26–27 · 20:2–8 · 21:7, 20–24', 6, true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('character-portraits', 'character-portraits', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload character portraits"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'character-portraits' and private.is_media_admin());
