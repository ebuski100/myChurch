-- VictoryCity M1.1: primary-administrator transfer + immutable transfer audit.
--
-- Schema plus one SECURITY DEFINER RPC. Deterministic under ordinary
-- `supabase db reset`. No row updates. No operator input. No bootstrap.
-- No guard activation. No custom GUC reads. No application changes.
--
-- Do NOT add bootstrap or guard-activation logic to this directory.
-- Bootstrap: supabase/manual/bootstrap_primary.sql (operator-run, explicit UUID).
-- Guard activation: supabase/manual/activate_primary_guard.sql (operator-run, after bootstrap).
--
-- Invariants this file relies on, created by 20261030000100_admin_primary_columns.sql:
--   * admin_users_single_active_primary -> at most one active primary, always
--                                          (immediate partial unique index).
--   * admin_users_lock_primary_mutation -> every primary-seat mutation serializes
--                                          on hashtext('victorycity_admin_primary_singleton').
--   * admin_users_must_retain_primary   -> at least one active primary at COMMIT,
--                                          once the operator activates the guard.
--
-- This file adds no competing guard. The transfer RPC takes the SAME advisory
-- key before touching any row, so it cannot interleave with bootstrap, guard
-- activation, a manual handover, or another transfer.
--
-- Deliberate difference from the manual handover recipe documented in
-- supabase/tests/concurrency_primary_guard.md: that recipe demotes the former
-- primary to is_active = false. The transfer RPC does NOT. The former primary
-- stays an ACTIVE standard administrator, per the M1.1 requirement.

begin;

-- 1. Audit trail -------------------------------------------------------------
-- One row per successful transfer. Append-only for API roles: no INSERT,
-- UPDATE or DELETE grant is issued to anon or authenticated, so only the
-- SECURITY DEFINER RPC below (running as the table owner) can write here.
--
-- The three identity columns intentionally carry NO foreign key to auth.users.
-- An audit row must survive deletion of the Auth account it names:
--   * `on delete cascade` would erase the history,
--   * `on delete set null` would rewrite the history as a side effect,
--   * `on delete restrict` would block ordinary Auth offboarding.
-- The UUIDs remain the stable identifiers recorded at transfer time.
create table public.admin_primary_transfers (
  id uuid primary key default gen_random_uuid(),
  previous_primary_id uuid not null,
  new_primary_id uuid not null,
  initiated_by_id uuid not null,
  transferred_at timestamptz not null default now(),
  constraint admin_primary_transfers_distinct_parties
    check (previous_primary_id <> new_primary_id)
);

create index admin_primary_transfers_transferred_at_idx
  on public.admin_primary_transfers (transferred_at desc);
create index admin_primary_transfers_new_primary_idx
  on public.admin_primary_transfers (new_primary_id, transferred_at desc);

alter table public.admin_primary_transfers enable row level security;

revoke all on public.admin_primary_transfers from public, anon, authenticated;
grant select on public.admin_primary_transfers to authenticated;

-- Read access for ACTIVE administrators only. Deliberately stricter than
-- public.is_admin(), which checks enrolment but not is_active. The subquery
-- runs under admin_users RLS (admin_users_read_self), so a caller can only ever
-- match their own row.
create policy admin_primary_transfers_read_active_admin
  on public.admin_primary_transfers
  for select to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
        and au.is_active
    )
  );

-- 2. Transfer RPC ------------------------------------------------------------
-- Moves the primary seat from the calling active primary to one active standard
-- administrator, atomically, and records the transfer. Raises (rolling back the
-- whole transaction, including the audit insert) on every rejected path.
create or replace function public.transfer_primary_admin(p_target_user_id uuid)
returns table (
  transfer_id uuid,
  previous_primary_id uuid,
  new_primary_id uuid,
  transferred_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_caller uuid;
  v_current_primary uuid;
  v_target_role text;
  v_target_active boolean;
  v_transfer_id uuid;
  v_transferred_at timestamptz := now();
begin
  v_caller := (select auth.uid());

  if v_caller is null then
    raise exception 'PRIMARY_TRANSFER_UNAUTHENTICATED: no authenticated user'
      using errcode = 'P0001';
  end if;

  if p_target_user_id is null then
    raise exception 'PRIMARY_TRANSFER_INVALID_TARGET: target user id is required'
      using errcode = 'P0001';
  end if;

  -- Same key as lock_primary_mutation(), the bootstrap script, and guard
  -- activation. Held until COMMIT, so concurrent transfers, bootstrap, guard
  -- activation, and every other seat mutation serialize behind one another.
  perform pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));

  -- Re-read the seat AFTER taking the lock. A transfer that committed while
  -- this call waited is visible here, so the caller is re-validated against the
  -- CURRENT seat, never against the seat it saw before blocking. FOR UPDATE
  -- pins the row so a concurrent deactivation cannot land between the check and
  -- the write below.
  select au.user_id
    into v_current_primary
    from public.admin_users au
    where au.role = 'primary' and au.is_active
    for update;

  if v_current_primary is null then
    raise exception 'PRIMARY_TRANSFER_NO_ACTIVE_PRIMARY: the primary seat is empty'
      using errcode = 'P0001';
  end if;

  if v_current_primary <> v_caller then
    raise exception 'PRIMARY_TRANSFER_NOT_PRIMARY: caller is not the active primary'
      using errcode = 'P0001';
  end if;

  -- Checked before the target lookup so self-transfer reports as self-transfer
  -- rather than as "target is not a standard administrator".
  if p_target_user_id = v_caller then
    raise exception 'PRIMARY_TRANSFER_SELF: cannot transfer the primary seat to the current primary'
      using errcode = 'P0001';
  end if;

  select au.role, au.is_active
    into v_target_role, v_target_active
    from public.admin_users au
    where au.user_id = p_target_user_id
    for update;

  if not found then
    raise exception 'PRIMARY_TRANSFER_TARGET_NOT_ADMIN: target is not an administrator'
      using errcode = 'P0001';
  end if;

  if v_target_role <> 'standard' then
    raise exception 'PRIMARY_TRANSFER_TARGET_NOT_STANDARD: target is not a standard administrator'
      using errcode = 'P0001';
  end if;

  if not v_target_active then
    raise exception 'PRIMARY_TRANSFER_TARGET_INACTIVE: target is deactivated'
      using errcode = 'P0001';
  end if;

  -- Demote BEFORE promoting: admin_users_single_active_primary is an immediate
  -- partial unique index, so promoting first would violate it. Zero active
  -- primaries exists only transiently inside this transaction; the deferred
  -- at-least-one guard (once activated) evaluates the COMMITTED state.
  --
  -- is_active is left untouched on both rows. The former primary therefore
  -- becomes an ACTIVE standard administrator, not a deactivated account.
  update public.admin_users
    set role = 'standard'
    where user_id = v_current_primary;

  update public.admin_users
    set role = 'primary'
    where user_id = p_target_user_id;

  -- Belt and braces: never write an audit row for a transfer that did not
  -- leave the invariant intact. This can only fire if a future change breaks
  -- the two updates above; the raise rolls the whole transaction back.
  if (
    select count(*)
    from public.admin_users
    where role = 'primary' and is_active
  ) <> 1 then
    raise exception 'PRIMARY_TRANSFER_INVARIANT: transfer did not leave exactly one active primary'
      using errcode = 'P0001';
  end if;

  insert into public.admin_primary_transfers
    (previous_primary_id, new_primary_id, initiated_by_id, transferred_at)
  values
    (v_current_primary, p_target_user_id, v_caller, v_transferred_at)
  returning id into v_transfer_id;

  return query
    select v_transfer_id, v_current_primary, p_target_user_id, v_transferred_at;
end
$fn$;

-- Functions are executable by PUBLIC by default. Revoke that, then grant only
-- to authenticated: anon cannot reach the seat at all, and the RPC still
-- re-validates the caller against the live seat on every call.
revoke all on function public.transfer_primary_admin(uuid) from public, anon, authenticated;
grant execute on function public.transfer_primary_admin(uuid) to authenticated;

commit;
