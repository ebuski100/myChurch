-- VictoryCity M1 operator bootstrap: promote the ONE verified primary admin.
--
-- MANUAL SCRIPT. Not a migration. Never runs under `supabase db reset`.
-- Run exactly once, by the operator, AFTER M1 migration is applied and
-- BEFORE guard activation (supabase/manual/activate_primary_guard.sql).
--
-- HOW TO USE
--   1. Identify the existing primary admin's Supabase Auth user id OUT OF BAND
--      (Auth dashboard user list, verified with the church owner). Do NOT guess.
--   2. Read-only verification first (Step 0 below): confirm the id exists in
--      auth.users and record the current admin_users seat state.
--   3. Replace EVERY occurrence of <TARGET_UUID> in this file with that id.
--      There are multiple occurrences; replace them all. Do not use a
--      different id in different places.
--   4. Run the whole file in ONE session against the target database
--      (local: psql to the direct DB URL from `supabase status`).
--   5. Read the verification output at the end. Proceed to guard activation
--      only if it reports exactly one active primary with the target id.
--
-- SAFEGUARDS (enforced by the script, not by convention)
--   - Refuses if the target has no auth.users row (BOOTSTRAP_TARGET_NO_AUTH_USER).
--   - Refuses if admin_users is non-empty and the target is not enrolled
--     (BOOTSTRAP_TARGET_NOT_ENROLLED). No silent inserts into a populated table.
--   - Refuses if ANOTHER active primary already exists
--     (BOOTSTRAP_ACTIVE_PRIMARY_EXISTS). Use handover/recovery, never re-bootstrap.
--   - Touches ONLY the target row for promotion; all other rows get role-only
--     standardization. is_active / deactivated_at / deactivated_by of other
--     accounts are preserved byte-for-byte.

-- Step 0 (read-only): record current state BEFORE any write. -----------------
select id as auth_user_id from auth.users where id = '<TARGET_UUID>'::uuid;

select user_id, role, is_active, created_at, deactivated_at
  from public.admin_users order by created_at;

select count(*) filter (where role = 'primary' and is_active) as active_primaries,
       max(user_id) filter (where role = 'primary' and is_active) as active_primary_id
  from public.admin_users;

-- Steps 1-2 (single write transaction). -------------------------------------
begin;
select pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));

-- Failure F1: target auth account missing -> abort, zero writes.
do $$ begin
  if not exists (select 1 from auth.users where id = '<TARGET_UUID>'::uuid) then
    raise exception 'BOOTSTRAP_TARGET_NO_AUTH_USER: %', '<TARGET_UUID>'
      using errcode = 'P0001';
  end if;
end $$;

-- Failure F2: populated table without the target -> abort, no silent insert.
do $$ declare c int; begin
  select count(*) into c from public.admin_users;
  if c > 0 and not exists
    (select 1 from public.admin_users where user_id = '<TARGET_UUID>'::uuid) then
    raise exception 'BOOTSTRAP_TARGET_NOT_ENROLLED: table has % row(s), none for target', c
      using errcode = 'P0001';
  end if;
end $$;

-- Failure F3: another active primary exists -> abort, use handover instead.
do $$ declare other uuid; begin
  select user_id into other from public.admin_users
    where role = 'primary' and is_active and user_id <> '<TARGET_UUID>'::uuid
    limit 1;
  if other is not null then
    raise exception 'BOOTSTRAP_ACTIVE_PRIMARY_EXISTS: % is already active; refusing to create a second primary', other
      using errcode = 'P0001';
  end if;
end $$;

-- Case A: empty table -> insert the verified primary.
insert into public.admin_users (user_id, role, is_active)
  select '<TARGET_UUID>'::uuid, 'primary', true
  where not exists (select 1 from public.admin_users);

-- Case B: target row exists -> promote in place. Only this row's
-- deactivation metadata is cleared (active=true requires deactivated_at null).
update public.admin_users
  set role = 'primary', is_active = true,
      deactivated_at = null, deactivated_by = null
  where user_id = '<TARGET_UUID>'::uuid;

-- Standardize all OTHER rows to role-only. Active/inactive state and
-- deactivation metadata are preserved exactly.
update public.admin_users
  set role = 'standard'
  where user_id <> '<TARGET_UUID>'::uuid
    and role <> 'standard';

commit;

-- Step 3 (read-only): verification. Proceed ONLY on count=1, id=<TARGET>. ---
select count(*) filter (where role = 'primary' and is_active) as active_primaries,
       max(user_id) filter (where role = 'primary' and is_active) as primary_id
  from public.admin_users;

select user_id, role, is_active, created_by, deactivated_at, deactivated_by
  from public.admin_users order by created_at;
