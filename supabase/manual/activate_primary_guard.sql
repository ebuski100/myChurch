-- VictoryCity M1 guard activation: at-least-one active primary (deferred).
--
-- MANUAL SCRIPT. Not a migration. Never runs under `supabase db reset`.
-- Run exactly once, by the operator, AFTER bootstrap verification
-- (supabase/manual/bootstrap_primary.sql) reports exactly one active
-- primary with the verified target id.
--
-- HOW TO USE
--   1. Confirm bootstrap Step 3 output: active_primaries = 1 and
--      primary_id = the verified target UUID. If not, STOP. Do not run this.
--   2. Run this whole file in ONE session against the target database
--      (local: psql to the direct DB URL from `supabase status`).
--   3. The script re-checks the seat BEFORE creating the trigger and aborts
--      with GUARD_SEAT_NOT_READY unless exactly one active primary exists.
--   4. Run the dry-run block at the end (commented out): it must fail with
--      PRIMARY_GUARD_ZERO and roll back, leaving the seat intact.
--
-- EFFECT
--   After activation, any transaction that would COMMIT with zero active
--   primaries is rejected (deferred constraint trigger). This covers
--   demotion, deactivation, row deletion, and Auth-user cascade deletion.
--   Transient zero mid-transaction (handover demote-then-promote) is legal;
--   only the committed state is checked.

begin;

-- Serialize with every primary-seat mutation: same transaction-level
-- advisory lock key used by lock_primary_mutation(). Held for the whole
-- transaction, so a concurrent demotion, promotion, deletion, handover, or
-- cascade racing this activation blocks until this script either commits
-- (guard armed, seat verified) or rolls back (nothing changed).
select pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));

-- Precondition: exactly one active primary, or refuse to arm the guard.
-- The count check, function creation, and trigger creation are all inside
-- this same transaction: a non-one count aborts everything, changing nothing.
do $$ declare n int; begin
  select count(*) into n from public.admin_users
    where role = 'primary' and is_active;
  if n <> 1 then
    raise exception 'GUARD_SEAT_NOT_READY: expected exactly 1 active primary, found %; complete bootstrap first', n
      using errcode = 'P0001';
  end if;
end $$;

create or replace function public.check_primary_retained()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  perform pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));
  if not exists (
    select 1 from public.admin_users
    where role = 'primary' and is_active
  ) then
    raise exception 'PRIMARY_GUARD_ZERO' using errcode = 'P0001';
  end if;
  return null;
end $fn$;

drop trigger if exists admin_users_must_retain_primary on public.admin_users;

create constraint trigger admin_users_must_retain_primary
  after update or delete on public.admin_users
  deferrable initially deferred
  for each row execute function public.check_primary_retained();

commit;

-- Post-activation verification (read-only): trigger present and deferred. ---
select tgname, tgenabled, tgdeferrable, tginitdeferred
  from pg_trigger
  where tgrelid = 'public.admin_users'::regclass
    and tgname = 'admin_users_must_retain_primary';

-- Dry run (staging/local only): uncomment, run, expect PRIMARY_GUARD_ZERO
-- with the seat unchanged afterwards. Do NOT run the inner update uncommented.
-- begin;
-- update public.admin_users set is_active = false, deactivated_at = now()
--   where role = 'primary' and is_active;
-- commit;
