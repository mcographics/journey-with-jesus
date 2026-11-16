-- Require a verified MFA session for Studio administrator operations once an
-- administrator has opted in to TOTP. Existing administrators without an
-- enrolled factor keep their current access until they complete enrollment.
-- The media_admins self-read policy remains available so the UI can identify
-- administrators before presenting the second-factor challenge.
create or replace function private.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.media_admins as admin
    where admin.user_id = auth.uid()
  ) and (
    not exists (
      select 1 from auth.mfa_factors as factor
      where factor.user_id = auth.uid()
        and factor.factor_type = 'totp'
        and factor.status = 'verified'
    )
    or (auth.jwt() ->> 'aal') = 'aal2'
  );
$$;

revoke all on function private.is_media_admin() from public;
grant execute on function private.is_media_admin() to anon, authenticated;
