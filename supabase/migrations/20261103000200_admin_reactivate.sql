-- VictoryCity M12: reactivate a deactivated standard administrator.
--
-- One SECURITY DEFINER RPC. Deterministic under ordinary
-- `supabase db reset`. No row inserts. No operator input. No bootstrap.
-- No guard activation. No application changes in this file.
--
-- WHY A NEW RPC
--   `deactivate_standard_admin` (20261103000100_admin_invitations.sql) moves
--   one way only, `create_admin_invitation` refuses addresses that already
--   belong to an administrator, and `accept_admin_invitation` refuses callers
--   that already have an `admin_users` row. None of them can restore access,
--   so reactivation needs its own writer. It updates the existing row in
--   place — same user_id, role set explicitly back to 'standard' — and is the
--   path the create-RPC comment anticipates ("re-enabled through
--   reactivation, never through a second invitation").
--
-- CONVENTIONS (matching M12)
--   * `begin; ... commit;`, pinned `set search_path = ''`, stable error-code
--     prefix `ADMIN_REACTIVATE_*` mapped by the application alongside
--     `ADMIN_INVITE_*` / `ADMIN_DEACTIVATE_*`; errcode P0001.
--   * No grants to anon/authenticated on the table; authenticated executes
--     the RPC, and the RPC re-validates the caller (active primary) itself.
--   * The target row is locked before the write, serializing against a
--     concurrent deactivation or primary transfer to the same account.

begin;

-- Reactivate ---------------------------------------------------------------
-- Restores access for one deactivated standard administrator by updating the
-- existing row: no new row is created, the user_id is untouched, and the
-- role is set explicitly to 'standard'. The primary seat is never touched:
-- self-reactivation and primary targets are rejected, so the at-most-one and
-- must-retain-primary invariants cannot be disturbed here.
create or replace function public.reactivate_standard_admin(
  p_target_user_id uuid
)
returns table (
  admin_user_id uuid,
  admin_is_active boolean
)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_caller uuid;
  v_target_role text;
  v_target_active boolean;
begin
  v_caller := (select auth.uid());
  if v_caller is null then
    raise exception 'ADMIN_REACTIVATE_UNAUTHENTICATED: no authenticated user'
      using errcode = 'P0001';
  end if;

  if p_target_user_id is null then
    raise exception 'ADMIN_REACTIVATE_INVALID_TARGET: target is required'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.admin_users caller
    where caller.user_id = v_caller
      and caller.role = 'primary'
      and caller.is_active
  ) then
    raise exception 'ADMIN_REACTIVATE_NOT_PRIMARY: caller is not the active primary'
      using errcode = 'P0001';
  end if;

  if p_target_user_id = v_caller then
    raise exception 'ADMIN_REACTIVATE_SELF: cannot reactivate your own account'
      using errcode = 'P0001';
  end if;

  select au.role, au.is_active
    into v_target_role, v_target_active
    from public.admin_users au
    where au.user_id = p_target_user_id
    for update;

  if not found then
    raise exception 'ADMIN_REACTIVATE_TARGET_NOT_ADMIN: target is not an administrator'
      using errcode = 'P0001';
  end if;

  if v_target_role <> 'standard' then
    raise exception 'ADMIN_REACTIVATE_TARGET_NOT_STANDARD: only standard administrators can be reactivated here'
      using errcode = 'P0001';
  end if;

  if v_target_active then
    raise exception 'ADMIN_REACTIVATE_TARGET_ACTIVE: administrator is already active'
      using errcode = 'P0001';
  end if;

  update public.admin_users
    set role = 'standard',
        is_active = true,
        deactivated_at = null,
        deactivated_by = null
    where user_id = p_target_user_id
    returning user_id, is_active
    into admin_user_id, admin_is_active;

  return next;
end
$fn$;

revoke all on function public.reactivate_standard_admin(uuid) from public, anon, authenticated;
grant execute on function public.reactivate_standard_admin(uuid) to authenticated;

commit;
