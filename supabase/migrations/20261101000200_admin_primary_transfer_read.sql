-- VictoryCity M1.2: read-side helper for the primary-transfer admin screen.
--
-- Schema only. Deterministic under ordinary `supabase db reset`. No row
-- updates. No operator input. No bootstrap. No guard activation.
--
-- WHY THIS EXISTS
--   `admin_users` is readable by `authenticated` only through the
--   `admin_users_read_self` policy, so the browser cannot enumerate other
--   administrators — and it must not. The primary-transfer screen still needs
--   the list of ELIGIBLE targets (active standard administrators) to show the
--   primary who they can hand the seat to. This SECURITY DEFINER function
--   answers exactly that question, and only for an active primary.
--
-- AUTHORIZATION MODEL
--   Same shape as the existing public.is_admin(): SECURITY DEFINER, pinned
--   search_path, PUBLIC execute revoked, granted only to authenticated. The
--   caller check is evaluated inside the function, not by RLS, so the result
--   set cannot be widened from the client. A non-primary caller — including a
--   standard administrator, an inactive administrator, or anon — receives zero
--   rows rather than an error, so the function reveals nothing about the seat.
--
--   `email` is included deliberately: confirming a transfer is meaningless
--   without an identifiable label, and a bare UUID cannot be confirmed by a
--   human. The value is only ever returned to the active primary.
--
-- This function is read-only and cannot change the seat. The only write path
-- remains public.transfer_primary_admin(uuid) in
-- 20261101000100_admin_primary_transfer.sql.

begin;

create or replace function public.list_primary_transfer_candidates()
returns table (
  user_id uuid,
  email text,
  admin_since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    au.user_id,
    u.email::text as email,
    au.created_at as admin_since
  from public.admin_users au
  join auth.users u on u.id = au.user_id
  where au.role = 'standard'
    and au.is_active
    and exists (
      select 1
      from public.admin_users caller
      where caller.user_id = (select auth.uid())
        and caller.role = 'primary'
        and caller.is_active
    )
  order by au.created_at, au.user_id;
$fn$;

revoke all on function public.list_primary_transfer_candidates() from public, anon, authenticated;
grant execute on function public.list_primary_transfer_candidates() to authenticated;

commit;
