-- Enforce a verified second factor only for approved Studio admins who opted into TOTP.
-- Admins without a verified TOTP factor keep their existing Magic Link / passkey access.
-- All media, staff, character, social, and private storage write policies already use
-- this private helper, so direct REST/Storage requests cannot bypass the MFA screen.
create or replace function private.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.media_admins as admin
    where admin.user_id = (select auth.uid())
  )
  and (
    not exists (
      select 1
      from auth.mfa_factors as factor
      where factor.user_id = (select auth.uid())
        and factor.factor_type = 'totp'
        and factor.status = 'verified'
    )
    or (select auth.jwt() ->> 'aal') = 'aal2'
  );
$$;

revoke all on function private.is_media_admin() from public;
grant execute on function private.is_media_admin() to anon, authenticated;
