-- VictoryCity M1.1 primary-transfer tests (pgTAP style, matching existing suite).
--
-- Run with (local only, after `supabase db reset`):
--   npx.cmd supabase db query --local --file supabase/tests/rls_primary_transfer.test.sql
--
-- Scope: 20261101000100_admin_primary_transfer.sql ONLY. Everything runs inside
-- one transaction and is rolled back at the end, so no row survives the run.
-- This file performs no migration, no bootstrap and no guard activation.
--
-- ISOLATION REQUIREMENT: like rls_primary_guard.test.sql, this file asserts
-- absolute seat counts and therefore MUST run on a disposable local database
-- with an EMPTY public.admin_users table (fresh `supabase db reset`, no
-- bootstrap applied). Assertion 1 enforces that precondition explicitly.
--
-- CONCURRENCY IS NOT COVERED HERE: pgTAP runs in a single session and this
-- repository installs no extension that would let one session drive another.
-- The two-session cases live in supabase/tests/concurrency_primary_transfer.md.
--
-- Caller identity for the RPC comes from auth.uid(), i.e. the request.jwt.claims
-- GUC that PostgREST populates. The suite sets it directly, which is the same
-- mechanism the existing suites use for `set local role`.

begin;

select plan(36);

-- Precondition: empty admin_users (disposable database). ---------------------
select is(
  (select count(*)::int from public.admin_users),
  0, 'precondition: admin_users is empty (disposable database, no bootstrap)');

-- Fixed fixtures keep this suite deterministic. Rolled back at the end.
--   P0 = active primary, S1 = active standard, S2 = inactive standard,
--   X1 = authenticated user who is NOT an administrator.
insert into auth.users (id) values
  ('14000000-0000-0000-0000-000000000001'),
  ('14000000-0000-0000-0000-000000000002'),
  ('14000000-0000-0000-0000-000000000003'),
  ('14000000-0000-0000-0000-000000000004');

insert into public.admin_users
  (user_id, role, is_active, deactivated_at, deactivated_by)
values
  ('14000000-0000-0000-0000-000000000001', 'primary',  true,  null, null),
  ('14000000-0000-0000-0000-000000000002', 'standard', true,  null, null),
  ('14000000-0000-0000-0000-000000000003', 'standard', false, now(),
   '14000000-0000-0000-0000-000000000001');

-- 1. New objects exist with the expected security posture. -------------------
select ok(
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_primary_transfers'
  ),
  'admin_primary_transfers audit table exists');

select ok(
  (select relrowsecurity from pg_class
    where oid = 'public.admin_primary_transfers'::regclass),
  'RLS is enabled on admin_primary_transfers');

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'transfer_primary_admin'),
  1, 'transfer_primary_admin(uuid) exists');

select ok(
  (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'transfer_primary_admin'),
  'transfer_primary_admin is SECURITY DEFINER');

select ok(
  (select array_to_string(p.proconfig, ',') like 'search_path=%'
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'transfer_primary_admin'),
  'transfer_primary_admin pins search_path');

-- 2. API-role privileges: execute for authenticated only, no audit writes. ---
select ok(
  not has_function_privilege('anon', 'public.transfer_primary_admin(uuid)', 'execute'),
  'anon cannot execute the transfer function');

select ok(
  has_function_privilege('authenticated', 'public.transfer_primary_admin(uuid)', 'execute'),
  'authenticated can execute the transfer function');

select ok(
  not has_table_privilege('authenticated', 'public.admin_primary_transfers', 'insert'),
  'authenticated cannot insert audit rows directly');

select ok(
  not has_table_privilege('authenticated', 'public.admin_primary_transfers', 'update'),
  'authenticated cannot update audit rows');

select ok(
  not has_table_privilege('authenticated', 'public.admin_primary_transfers', 'delete'),
  'authenticated cannot delete audit rows');

select ok(
  has_table_privilege('authenticated', 'public.admin_primary_transfers', 'select'),
  'authenticated can select audit rows (RLS limits them to active admins)');

-- 3. Standard administrators still cannot promote themselves by any route. ---
select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'insert'),
  'authenticated still cannot insert admin_users');

select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'update'),
  'authenticated still cannot update admin_users');

select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'delete'),
  'authenticated still cannot delete admin_users');

-- 4. Rejected transfers: every path must raise and change nothing. ----------
-- Act as P0, the active primary.
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;

select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000001'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_SELF: cannot transfer the primary seat to the current primary',
  'a primary administrator cannot transfer the seat to themselves');

reset role;
select is(
  (select user_id::text from public.admin_users where role = 'primary' and is_active),
  '14000000-0000-0000-0000-000000000001',
  'self-transfer attempt left the seat with the original primary');

select is(
  (select count(*)::int from public.admin_primary_transfers),
  0, 'self-transfer attempt wrote no audit row');

set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin(null::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_INVALID_TARGET: target user id is required',
  'a null target is rejected');
reset role;

-- Act as S1, an active STANDARD administrator (cannot initiate, cannot self-promote).
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000002'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_NOT_PRIMARY: caller is not the active primary',
  'a standard administrator cannot take the seat, even for themselves');
reset role;

-- Act as X1, an authenticated user with no administrator enrolment at all.
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000004","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000002'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_NOT_PRIMARY: caller is not the active primary',
  'a non-administrator cannot initiate a transfer');
reset role;

-- Back to P0 for the target-validation cases.
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000099'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_TARGET_NOT_ADMIN: target is not an administrator',
  'a target that is not an administrator is rejected');

select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000003'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_TARGET_INACTIVE: target is deactivated',
  'an inactive standard administrator is rejected as a target');
reset role;

-- Unauthenticated caller: no JWT subject at all.
set local request.jwt.claims = '';
set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000002'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_UNAUTHENTICATED: no authenticated user',
  'an unauthenticated caller is rejected');
reset role;

select is(
  (select count(*)::int from public.admin_users where role = 'primary' and is_active),
  1, 'every rejected transfer left exactly one active primary');

-- 5. Successful transfer P0 -> S1. ------------------------------------------
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;
select is(
  (select previous_primary_id::text || '->' || new_primary_id::text
    from public.transfer_primary_admin('14000000-0000-0000-0000-000000000002'::uuid)),
  '14000000-0000-0000-0000-000000000001->14000000-0000-0000-0000-000000000002',
  'a successful transfer reports the previous primary and the new primary');
reset role;

select is(
  (select count(*)::int from public.admin_users where role = 'primary' and is_active),
  1, 'exactly one active primary remains after a successful transfer');

select is(
  (select user_id::text from public.admin_users where role = 'primary' and is_active),
  '14000000-0000-0000-0000-000000000002',
  'the target is now the active primary');

select is(
  (select role || '/' || is_active::text from public.admin_users
    where user_id = '14000000-0000-0000-0000-000000000001'),
  'standard/true',
  'the former primary remains an ACTIVE standard administrator');

-- 6. Audit record. -----------------------------------------------------------
select is(
  (select previous_primary_id::text || '->' || new_primary_id::text
     || '|' || initiated_by_id::text
    from public.admin_primary_transfers
    order by transferred_at desc, id desc
    limit 1),
  '14000000-0000-0000-0000-000000000001->14000000-0000-0000-0000-000000000002|14000000-0000-0000-0000-000000000001',
  'audit row records previous primary, new primary and initiating user');

select ok(
  (select transferred_at is not null from public.admin_primary_transfers
    order by transferred_at desc, id desc limit 1),
  'audit row records the transfer timestamp');

select is(
  (select count(*)::int from public.admin_primary_transfers),
  1, 'exactly one audit row after one successful transfer');

-- 7. The seat has really moved: the old primary is fenced out. --------------
set local role authenticated;
select throws_ok(
  $$select public.transfer_primary_admin('14000000-0000-0000-0000-000000000001'::uuid)$$,
  'P0001', 'PRIMARY_TRANSFER_NOT_PRIMARY: caller is not the active primary',
  'the former primary can no longer initiate a transfer');
reset role;

-- 8. Transfer back S1 -> P0, and the audit trail grows. ---------------------
set local request.jwt.claims = '{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select is(
  (select previous_primary_id::text || '->' || new_primary_id::text
    from public.transfer_primary_admin('14000000-0000-0000-0000-000000000001'::uuid)),
  '14000000-0000-0000-0000-000000000002->14000000-0000-0000-0000-000000000001',
  'the new primary can transfer the seat back');
reset role;

select is(
  (select user_id::text from public.admin_users where role = 'primary' and is_active),
  '14000000-0000-0000-0000-000000000001',
  'the seat is back with the original primary, still exactly one active primary');

select is(
  (select count(*)::int from public.admin_primary_transfers),
  2, 'the audit trail holds both transfers');

select * from finish();
rollback;
