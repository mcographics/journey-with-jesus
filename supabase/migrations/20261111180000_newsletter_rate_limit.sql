create table if not exists public.newsletter_rate_limits (
  fingerprint_hash text primary key check (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count smallint not null default 1 check (request_count between 1 and 5)
);

create index if not exists newsletter_rate_limits_window_started_at_idx
  on public.newsletter_rate_limits (window_started_at);

alter table public.newsletter_rate_limits enable row level security;
revoke all on table public.newsletter_rate_limits from public, anon, authenticated;
grant all on table public.newsletter_rate_limits to service_role;

create or replace function public.check_newsletter_rate_limit(p_fingerprint_hash text)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count smallint;
begin
  if p_fingerprint_hash is null or p_fingerprint_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_newsletter_rate_limit_fingerprint' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_fingerprint_hash, 0));

  delete from public.newsletter_rate_limits
  where window_started_at < v_now - interval '24 hours';

  select window_started_at, request_count
    into v_window_started_at, v_request_count
    from public.newsletter_rate_limits
    where fingerprint_hash = p_fingerprint_hash;

  if not found then
    insert into public.newsletter_rate_limits (fingerprint_hash, window_started_at, request_count)
    values (p_fingerprint_hash, v_now, 1);
    return true;
  end if;

  if v_window_started_at <= v_now - interval '1 hour' then
    update public.newsletter_rate_limits
      set window_started_at = v_now, request_count = 1
      where fingerprint_hash = p_fingerprint_hash;
    return true;
  end if;

  if v_request_count >= 5 then
    return false;
  end if;

  update public.newsletter_rate_limits
    set request_count = request_count + 1
    where fingerprint_hash = p_fingerprint_hash;
  return true;
end;
$function$;

revoke all on function public.check_newsletter_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_newsletter_rate_limit(text) to service_role;
