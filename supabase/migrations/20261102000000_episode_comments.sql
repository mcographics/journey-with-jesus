create table if not exists public.published_episodes (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  published boolean not null default true
);

create table if not exists public.episode_comments (
  id uuid primary key default gen_random_uuid(),
  episode_id text not null references public.published_episodes(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  body text not null check (char_length(body) between 3 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists episode_comments_approved_newest_idx
  on public.episode_comments (episode_id, created_at desc)
  where status = 'approved';

create table if not exists public.comment_rate_limits (
  fingerprint_hash text primary key check (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  next_allowed_at timestamptz not null
);

alter table public.published_episodes enable row level security;
alter table public.episode_comments enable row level security;
alter table public.comment_rate_limits enable row level security;

revoke all on table public.published_episodes from anon, authenticated;
revoke all on table public.episode_comments from anon, authenticated;
revoke all on table public.comment_rate_limits from anon, authenticated;
grant select on table public.episode_comments to anon, authenticated;
grant all on table public.published_episodes to service_role;
grant all on table public.episode_comments to service_role;
grant all on table public.comment_rate_limits to service_role;

drop policy if exists "Visitors can read approved comments" on public.episode_comments;
create policy "Visitors can read approved comments"
  on public.episode_comments
  for select
  to anon, authenticated
  using (status = 'approved');

create or replace function public.submit_episode_comment(
  p_episode_id text,
  p_display_name text,
  p_body text,
  p_fingerprint_hash text
)
returns table (id uuid, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_next_allowed_at timestamptz;
  v_comment_id uuid;
  v_created_at timestamptz;
begin
  if p_episode_id is null or p_episode_id !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_episode_id' using errcode = '22023';
  end if;

  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 60 then
    raise exception 'invalid_display_name' using errcode = '22023';
  end if;

  if p_body is null or char_length(btrim(p_body)) not between 3 and 2000 then
    raise exception 'invalid_comment_body' using errcode = '22023';
  end if;

  if p_fingerprint_hash is null or p_fingerprint_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_request_fingerprint' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.published_episodes as episode
    where episode.id = p_episode_id and episode.published
  ) then
    raise exception 'episode_not_available' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_fingerprint_hash, 0));

  delete from public.comment_rate_limits
  where next_allowed_at < clock_timestamp() - interval '1 day';

  select limit_row.next_allowed_at
    into v_next_allowed_at
    from public.comment_rate_limits as limit_row
    where limit_row.fingerprint_hash = p_fingerprint_hash
    for update;

  if v_next_allowed_at is not null and v_next_allowed_at > clock_timestamp() then
    raise exception 'comment_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.comment_rate_limits (fingerprint_hash, next_allowed_at)
  values (p_fingerprint_hash, clock_timestamp() + interval '60 seconds')
  on conflict (fingerprint_hash)
  do update set next_allowed_at = excluded.next_allowed_at;

  insert into public.episode_comments (episode_id, display_name, body, status)
  values (p_episode_id, btrim(p_display_name), btrim(p_body), 'pending')
  returning episode_comments.id, episode_comments.created_at
    into v_comment_id, v_created_at;

  return query select v_comment_id, 'pending'::text, v_created_at;
end;
$$;

revoke all on function public.submit_episode_comment(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_episode_comment(text, text, text, text) to service_role;
