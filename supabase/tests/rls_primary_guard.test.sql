-- VictoryCity M1 guard tests (pgTAP style, matching existing suite).
--
-- Run with (local only, after `supabase db reset`):
--   npx.cmd supabase db query --local --file supabase/tests/rls_primary_guard.test.sql
--
-- Scope: M1 migration effects ONLY. All fixtures roll back at the end.
-- Requires pgTAP functions (plan/ok/is/throws_ok/finish) like the existing
-- rls_content_foundation.test.sql. If pgTAP is unavailable locally, this file
-- documents the assertions; see RUNBOOK for the fallback psql checks.
--
-- ISOLATION REQUIREMENT: this test asserts absolute seat counts (e.g.
-- exactly-one-active-primary). It MUST run on a disposable local database
-- with an EMPTY public.admin_users table (fresh `supabase db reset`, no
-- bootstrap applied). Assertion 1 enforces this precondition explicitly and
-- fails loudly instead of producing misleading results on a populated table.
-- It never touches production data or production Auth users; all Auth
-- fixtures use synthetic 12000000-* UUIDs rolled back at the end.
-- It does not modify any RLS policy; section 8 only inspects privileges.

begin;

select plan(21);

-- Precondition: empty admin_users (disposable database). ---------------------
select is(
  (select count(*)::int from public.admin_users),
  0, 'precondition: admin_users is empty (disposable database, no bootstrap)');

-- Fixed fixtures keep this suite deterministic. Rolled back at the end.
insert into auth.users (id) values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002'),
  ('12000000-0000-0000-0000-000000000003');

-- 1. M1 columns exist with correct defaults. --------------------------------
select ok(
  (select column_name from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='role') = 'role',
  'admin_users has role column');
select ok(
  (select column_name from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='is_active') = 'is_active',
  'admin_users has is_active column');
select ok(
  (select column_name from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='created_by') = 'created_by',
  'admin_users has created_by column');
select ok(
  (select column_name from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='deactivated_at') = 'deactivated_at',
  'admin_users has deactivated_at column');
select ok(
  (select column_name from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='deactivated_by') = 'deactivated_by',
  'admin_users has deactivated_by column');

select is(
  (select column_default from information_schema.columns
    where table_schema='public' and table_name='admin_users' and column_name='role'),
  '''standard''::text', 'role defaults to standard');

select ok(
  (select indexname from pg_indexes where schemaname='public' and tablename='admin_users'
    and indexname='admin_users_single_active_primary') = 'admin_users_single_active_primary',
  'at-most-one partial unique index exists');

-- 2. Mutation lock trigger present, bidirectional (insert/update/delete). ---
select is(
  (select count(*)::int from pg_trigger
    where tgrelid='public.admin_users'::regclass and tgname='admin_users_lock_primary_mutation'),
  1, 'lock_primary_mutation trigger exists on admin_users');

-- 3. No zero-guard yet in M1 (guard activation is a separate manual step). --
select is(
  (select count(*)::int from pg_trigger
    where tgrelid='public.admin_users'::regclass and tgname='admin_users_must_retain_primary'),
  0, 'at-least-one guard trigger is NOT in M1');

-- 4. No recover_primary() in M1 (deferred to M5). -----------------------------
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='recover_primary'),
  0, 'recover_primary does not exist in M1');

-- 5. M1 changed no row values: fresh inserts still default to standard/active.
insert into public.admin_users (user_id) values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002');
select is(
  (select role from public.admin_users where user_id='12000000-0000-0000-0000-000000000001'),
  'standard', 'new rows default to standard role');
select is(
  (select is_active from public.admin_users where user_id='12000000-0000-0000-0000-000000000001'),
  true, 'new rows default to active');

-- 6. At-most-one enforced immediately: second active primary rejected. -------
update public.admin_users set role='primary'
  where user_id='12000000-0000-0000-0000-000000000001';
select is(
  (select role from public.admin_users where user_id='12000000-0000-0000-0000-000000000001'),
  'primary', 'first promotion to primary succeeds (no other primary)');

select throws_ok(
  $$update public.admin_users set role='primary' where user_id='12000000-0000-0000-0000-000000000002'$$,
  '23505', 'duplicate key value violates unique constraint "admin_users_single_active_primary"',
  'second concurrent-style promotion to primary fails on unique index');

select is(
  (select count(*)::int from public.admin_users where role='primary' and is_active),
  1, 'exactly one active primary after rejected second promotion');

-- 7. Promoting an inactive row to primary fails the active-state check, ------
--    not silently: deactivated rows keep their metadata untouched.
update public.admin_users
  set is_active=false, deactivated_at=now(), deactivated_by='12000000-0000-0000-0000-000000000001'
  where user_id='12000000-0000-0000-0000-000000000002';
select is(
  (select deactivated_by::text from public.admin_users where user_id='12000000-0000-0000-0000-000000000002'),
  '12000000-0000-0000-0000-000000000001', 'deactivation metadata recorded, not erased');

select throws_ok(
  $$insert into public.admin_users (user_id, role, is_active)
    values ('12000000-0000-0000-0000-000000000003', 'standard', false)$$,
  '23514', 'new row violates check constraint "admin_users_active_needs_timestamp"',
  'inactive row without deactivated_at violates active-needs-timestamp check');

-- 8. Existing RLS posture on admin_users unchanged by M1. ---------------------
select ok(
  (select relrowsecurity from pg_class where oid='public.admin_users'::regclass),
  'RLS still enabled on admin_users');
select ok(
  not has_table_privilege('authenticated', 'public.admin_users', 'insert'),
  'authenticated still cannot insert admin_users');
select ok(
  has_table_privilege('authenticated', 'public.admin_users', 'select'),
  'authenticated can still select admin_users (own-row policy)');

select * from finish();
rollback;
