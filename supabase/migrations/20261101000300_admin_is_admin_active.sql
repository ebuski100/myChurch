-- VictoryCity M1.1 follow-up (F1): public.is_admin() must require is_active.
--
-- Schema only. Deterministic under ordinary `supabase db reset`. No row
-- updates. No operator input. No bootstrap. No guard activation.
--
-- WHY
--   The original public.is_admin() (20261013000100_content_foundation.sql)
--   asks only whether an admin_users row EXISTS for auth.uid(). Every content
--   write policy — resources, resource_assets, assets, events, ministries,
--   gallery, departments — is built on that function. A DEACTIVATED
--   administrator therefore kept full write access through PostgREST for as
--   long as their JWT stayed valid (up to jwt_expiry, one hour by default),
--   even though the application layer already refuses them: getAdminAccess()
--   requires is_active = true.
--
--   This migration makes the database agree with the application. An
--   administrator is an administrator only while is_active is true.
--
-- COMPATIBILITY
--   `create or replace` keeps the function's OID, so every existing policy
--   that calls public.is_admin() keeps working without being redefined.
--   Signature, volatility (stable), SECURITY DEFINER, pinned search_path and
--   grants are all preserved. The grant statements are re-issued for
--   explicitness; they are idempotent with the originals.
--
--   public.admin_users.is_active is `not null default true` and is added by
--   20261030000100_admin_primary_columns.sql, which applies before this file.
--
-- NOT CHANGED, DELIBERATELY
--   The admin_users_read_self policy still matches on user_id alone. An
--   inactive administrator must keep reading their OWN row: the application
--   needs it to distinguish "deactivated" from "never enrolled", and it
--   exposes nothing about any other account.
--
--   The primary-transfer RPC, the candidate-list function and the audit-table
--   policy already test is_active directly and are untouched by this file.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

commit;
