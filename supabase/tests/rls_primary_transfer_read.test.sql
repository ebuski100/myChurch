-- VictoryCity M1.1 read-side authorization tests (G1 + G2).
--
-- Run with (local only, after `supabase db reset`):
--   npx.cmd supabase db query --local --file supabase/tests/rls_primary_transfer_read.test.sql
--
-- Scope: the two READ surfaces of the primary-transfer feature, which the
-- write-side suite (rls_primary_transfer.test.sql) does not cover:
--
--   G1. public.list_primary_transfer_candidates()
--       (20261101000200_admin_primary_transfer_read.sql)
--   G2. the admin_primary_transfers audit table's read policy
--       (20261101000100_admin_primary_transfer.sql)
--
-- Everything runs inside one transaction and is rolled back at the end, so no
-- row survives the run. No migration, no bootstrap, no guard activation.
--
-- DOCUMENTED ACCESS MODEL — asserted here, not invented here:
--
--   Candidate list. The migration comment states that the function answers
--   only for an active primary, and that "a non-primary caller — including a
--   standard administrator, an inactive administrator, or anon — receives zero
--   rows rather than an error, so the function reveals nothing about the
--   seat". Zero rows, not an error, is therefore the expected outcome below.
--   anon additionally has no EXECUTE privilege at all (revoked in the
--   migration), so it cannot call the function even to receive zero rows.
--
--   Audit trail. The policy comment states "Read access for ACTIVE
--   administrators only", and src/lib/admin-primary-data.ts repeats that any
--   ACTIVE administrator may read the history. A STANDARD administrator
--   reading the trail is therefore INTENDED, not an oversight: it is the
--   documented policy, and assertion 15 pins that behaviour so a future
--   tightening is a deliberate, visible change rather than an accident.
--   Inactive administrators and non-administrators see zero rows; anon has no
--   SELECT privilege at all.
--
-- WHY anon IS ASSERTED VIA PRIVILEGE, NOT BY SWITCHING ROLE: anon also lacks
-- EXECUTE on the pgTAP functions themselves, so `set local role anon` would
-- fail on the assertion call rather than on the statement under test. The
-- privilege assertions are the same guarantee and match the existing
-- rls_primary_transfer.test.sql style.
--
-- ISOLATION REQUIREMENT: this file asserts an empty public.admin_users table as
-- its first check, so it MUST run on a disposable local database (fresh
-- `supabase db reset`, no bootstrap applied). All fixtures use synthetic
-- 18000000-* UUIDs and roll back at the end.

begin;

select plan(20);

-- Precondition: empty admin_users (disposable database). ---------------------
select is(
  (select count(*)::int from public.admin_users),
  0, 'precondition: admin_users is empty (disposable database, no bootstrap)');

-- Fixed fixtures keep this suite deterministic. Rolled back at the end.
--   P0 = active primary        S1 = active standard
--   S3 = active standard       S2 = DEACTIVATED standard
--   P9 = DEACTIVATED primary   X1 = authenticated user, not an administrator
--
-- P9 exists to prove that an inactive account is never an eligible target and
-- that an inactive PRIMARY caller receives nothing. An inactive primary row is
-- legal: admin_users_single_active_primary is a partial index over
-- (role = 'primary' and is_active) only.
insert into auth.users (id, email) values
  ('18000000-0000-0000-0000-000000000001', null),
  ('18000000-0000-0000-0000-000000000002', 's1@fixture.invalid'),
  ('18000000-0000-0000-0000-000000000003', 's3@fixture.invalid'),
  ('18000000-0000-0000-0000-000000000004', null),
  ('18000000-0000-0000-0000-000000000005', null),
  ('18000000-0000-0000-0000-000000000006', null);

insert into public.admin_users
  (user_id, role, is_active, deactivated_at, deactivated_by)
values
  ('18000000-0000-0000-0000-000000000001', 'primary',  true,  null, null),
  ('18000000-0000-0000-0000-000000000002', 'standard', true,  null, null),
  ('18000000-0000-0000-0000-000000000003', 'standard', true,  null, null),
  ('18000000-0000-0000-0000-000000000004', 'standard', false, now(),
   '18000000-0000-0000-0000-000000000001'),
  ('18000000-0000-0000-0000-000000000005', 'primary',  false, now(),
   '18000000-0000-0000-0000-000000000001');

-- Two audit rows, written here as the table owner because only the SECURITY
-- DEFINER RPC may insert at runtime (asserted by the write-side suite). They
-- are fixtures for the read policy, not a bypass of the design.
insert into public.admin_primary_transfers
  (previous_primary_id, new_primary_id, initiated_by_id, transferred_at)
values
  ('18000000-0000-0000-0000-000000000001',
   '18000000-0000-0000-0000-000000000002',
   '18000000-0000-0000-0000-000000000001',
   now() - interval '2 days'),
  ('18000000-0000-0000-0000-000000000002',
   '18000000-0000-0000-0000-000000000001',
   '18000000-0000-0000-0000-000000000002',
   now() - interval '1 day');

-- ===========================================================================
-- G1. list_primary_transfer_candidates()
-- ===========================================================================

-- 1. Security posture of the read function. ---------------------------------
select ok(
  (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'list_primary_transfer_candidates'),
  'list_primary_transfer_candidates is SECURITY DEFINER');

select ok(
  (select array_to_string(p.proconfig, ',') like 'search_path=%'
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'list_primary_transfer_candidates'),
  'list_primary_transfer_candidates pins search_path');

select ok(
  not has_function_privilege('anon', 'public.list_primary_transfer_candidates()', 'execute'),
  'anon cannot execute the candidate list at all');

select ok(
  has_function_privilege('authenticated', 'public.list_primary_transfer_candidates()', 'execute'),
  'authenticated can execute the candidate list (the function scopes the rows)');

-- 2. The active primary receives ONLY eligible active standard admins. ------
set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  2, 'the active primary sees exactly the two active standard administrators');

select is(
  (select array_agg(user_id order by user_id)
     from public.list_primary_transfer_candidates()),
  array['18000000-0000-0000-0000-000000000002'::uuid,
        '18000000-0000-0000-0000-000000000003'::uuid],
  'the result excludes the deactivated standard admin and both primary accounts');

select is(
  (select email from public.list_primary_transfer_candidates()
    where user_id = '18000000-0000-0000-0000-000000000002'),
  's1@fixture.invalid',
  'each candidate carries the Auth email that identifies them to a human');

reset role;

-- 3. Every other caller receives ZERO ROWS, not an error. -------------------
set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  0, 'an active STANDARD administrator receives zero candidate rows');
reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  0, 'a DEACTIVATED administrator receives zero candidate rows');
reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000005","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  0, 'a DEACTIVATED primary administrator receives zero candidate rows');
reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000006","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  0, 'an authenticated non-administrator receives zero candidate rows');
reset role;

-- Authenticated role, but no JWT subject at all (auth.uid() is null).
set local request.jwt.claims = '';
set local role authenticated;
select is(
  (select count(*)::int from public.list_primary_transfer_candidates()),
  0, 'a caller with no JWT subject receives zero candidate rows');
reset role;

-- ===========================================================================
-- G2. admin_primary_transfers read policy
-- ===========================================================================

-- 4. The policy under test is the documented one. ---------------------------
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_primary_transfers'
      and policyname = 'admin_primary_transfers_read_active_admin'
      and cmd = 'SELECT'
      and 'authenticated' = any (roles)
  ),
  'the audit table is read through admin_primary_transfers_read_active_admin (SELECT, authenticated)');

select ok(
  has_table_privilege('authenticated', 'public.admin_primary_transfers', 'select'),
  'authenticated holds SELECT on the audit table (RLS narrows it)');

select ok(
  not has_table_privilege('anon', 'public.admin_primary_transfers', 'select'),
  'anon holds no SELECT on the audit table at all');

-- 5. Who actually sees the rows. --------------------------------------------
set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.admin_primary_transfers),
  2, 'the active primary reads the full audit trail');
reset role;

-- Documented policy: ANY active administrator may read the history. This
-- assertion pins that decision; changing it must be a deliberate edit.
set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.admin_primary_transfers),
  2, 'an active STANDARD administrator also reads the trail (documented policy)');
reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.admin_primary_transfers),
  0, 'a DEACTIVATED administrator reads zero audit rows');
reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-0000-0000-000000000006","role":"authenticated"}';
set local role authenticated;
select is(
  (select count(*)::int from public.admin_primary_transfers),
  0, 'an authenticated non-administrator reads zero audit rows');
reset role;

select * from finish();
rollback;
