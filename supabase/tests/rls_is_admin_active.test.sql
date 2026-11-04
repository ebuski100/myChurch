-- VictoryCity M1.1 follow-up tests (F1): is_admin() requires is_active.
--
-- Run with (local only, after `supabase db reset`):
--   npx.cmd supabase db query --local --file supabase/tests/rls_is_admin_active.test.sql
--
-- Scope: 20261101000300_admin_is_admin_active.sql ONLY. Everything runs inside
-- one transaction and is rolled back at the end, so no row survives the run.
-- This file performs no migration, no bootstrap and no guard activation.
--
-- WHAT THIS PROVES
--   Before the fix, public.is_admin() asked only whether an admin_users row
--   existed, so a deactivated administrator kept write access to every content
--   table through PostgREST. After the fix an administrator counts only while
--   is_active is true, and an active administrator is unaffected.
--
-- ISOLATION REQUIREMENT: like the other suites, this file asserts an empty
-- public.admin_users table as its first check. It MUST run on a disposable
-- local database (fresh `supabase db reset`, no bootstrap applied). All
-- fixtures use synthetic 17000000-* UUIDs and roll back at the end.

begin;

select plan(10);

-- Precondition: empty admin_users (disposable database). ---------------------
select is(
  (select count(*)::int from public.admin_users),
  0, 'precondition: admin_users is empty (disposable database, no bootstrap)');

-- Fixed fixtures keep this suite deterministic. Rolled back at the end.
--   A1 = active standard administrator
--   A2 = DEACTIVATED standard administrator
--   X1 = authenticated user who is NOT an administrator
insert into auth.users (id) values
  ('17000000-0000-0000-0000-000000000001'),
  ('17000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000003');

insert into public.admin_users
  (user_id, role, is_active, deactivated_at, deactivated_by)
values
  ('17000000-0000-0000-0000-000000000001', 'standard', true,  null, null),
  ('17000000-0000-0000-0000-000000000002', 'standard', false, now(),
   '17000000-0000-0000-0000-000000000001');

-- 1. The function still has the security posture of the original. ------------
select ok(
  (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'),
  'is_admin is still SECURITY DEFINER');

select ok(
  (select array_to_string(p.proconfig, ',') like 'search_path=%'
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'),
  'is_admin still pins search_path');

select ok(
  has_function_privilege('authenticated', 'public.is_admin()', 'execute'),
  'authenticated can still execute is_admin');

select ok(
  not has_function_privilege('anon', 'public.is_admin()', 'execute'),
  'anon still cannot execute is_admin');

-- 2. The fix itself: only an ACTIVE administrator is an administrator. -------
set local request.jwt.claims = '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;
select is(
  public.is_admin(), true,
  'an active administrator is still recognised by is_admin()');
reset role;

set local request.jwt.claims = '{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select is(
  public.is_admin(), false,
  'a DEACTIVATED administrator is no longer recognised by is_admin()');
reset role;

set local request.jwt.claims = '{"sub":"17000000-0000-0000-0000-000000000003","role":"authenticated"}';
set local role authenticated;
select is(
  public.is_admin(), false,
  'an authenticated user with no admin_users row is not recognised');
reset role;

-- 3. The consequence at the policy layer, on a representative table. ---------
-- resources_admin_insert is `with check (is_admin())`. Before the fix this
-- insert SUCCEEDED for a deactivated administrator.
set local request.jwt.claims = '{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$insert into public.resources (resource_type, slug, title)
    values ('audio', 'f1-inactive-write', 'Deactivated admin write fixture')$$,
  '42501', 'new row violates row-level security policy for table "resources"',
  'a deactivated administrator cannot insert content through RLS');
reset role;

set local request.jwt.claims = '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local role authenticated;
select lives_ok(
  $$insert into public.resources (resource_type, slug, title)
    values ('audio', 'f1-active-write', 'Active admin write fixture')$$,
  'an active administrator can still insert content through RLS');
reset role;

select * from finish();
rollback;
