-- Regression test for the deferred primary guard under an authenticated
-- transfer RPC. The test requires exactly one active primary; its transfer and
-- all fixtures/guard installation roll back at the end.
--
-- Run against local Supabase only:
--   npx.cmd supabase test db supabase/tests/rls_primary_guard_security_definer.test.sql --local

begin;

select plan(13);

select is(
  (select count(*)::int from public.admin_users where role = 'primary' and is_active),
  1, 'precondition: exactly one active primary exists');

select is(
  (select count(*)::int from auth.users
    where id = '16000000-0000-0000-0000-000000000002'),
  0, 'test Auth user id is unused');

select is(
  (select count(*)::int from public.admin_users
    where user_id = '16000000-0000-0000-0000-000000000002'),
  0, 'test administrator id is unused');

insert into auth.users (id) values
  ('16000000-0000-0000-0000-000000000002');

insert into public.admin_users (user_id, role, is_active) values
  ('16000000-0000-0000-0000-000000000002', 'standard', true);

-- Recreate the manually activated function in its previous invoker form, then
-- apply the security-attribute change made by the migration.
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
end
$fn$;

create temporary table primary_guard_function_before as
select proowner, proconfig, prosrc
from pg_proc
where oid = 'public.check_primary_retained()'::regprocedure;

do $migration$
begin
  if to_regprocedure('public.check_primary_retained()') is not null then
    execute 'alter function public.check_primary_retained() security definer';
  end if;
end
$migration$;

drop trigger if exists admin_users_must_retain_primary on public.admin_users;
create constraint trigger admin_users_must_retain_primary
  after update or delete on public.admin_users
  deferrable initially deferred
  for each row execute function public.check_primary_retained();

select ok(
  (select prosecdef from pg_proc
    where oid = 'public.check_primary_retained()'::regprocedure),
  'check_primary_retained is SECURITY DEFINER');

select ok(
  (select p.proconfig @> array['search_path=""']
      and p.proowner = snapshot.proowner
      and p.proconfig is not distinct from snapshot.proconfig
      and p.prosrc is not distinct from snapshot.prosrc
    from pg_proc p
    cross join primary_guard_function_before snapshot
    where p.oid = 'public.check_primary_retained()'::regprocedure),
  'the migration changes only prosecdef and preserves owner, body, and empty search_path');

select is(
  (select pg_get_userbyid(proowner) from pg_proc
    where oid = 'public.check_primary_retained()'::regprocedure),
  'postgres', 'check_primary_retained retains the postgres owner');

select ok(
  (select tgenabled = 'O' and tgdeferrable and tginitdeferred from pg_trigger
    where tgrelid = 'public.admin_users'::regclass
      and tgname = 'admin_users_must_retain_primary'),
  'the guard trigger remains enabled and initially deferred');

select ok(
  set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select user_id::text from public.admin_users
        where role = 'primary' and is_active),
      'role', 'authenticated'
    )::text,
    true
  ) is not null,
  'authenticated primary identity is set for the transfer');

set local role authenticated;

select is(
  (select new_primary_id::text
    from public.transfer_primary_admin('16000000-0000-0000-0000-000000000002'::uuid)),
  '16000000-0000-0000-0000-000000000002',
  'authenticated primary can transfer the seat');

-- Fire the deferred trigger after the SECURITY DEFINER RPC has returned, while
-- the transaction is still running as authenticated.
set constraints admin_users_must_retain_primary immediate;
reset role;

select is(
  (select count(*)::int from public.admin_users where role = 'primary' and is_active),
  1, 'deferred guard accepts the committed one-primary state');

select is(
  (select user_id::text from public.admin_users where role = 'primary' and is_active),
  '16000000-0000-0000-0000-000000000002',
  'the target remains the active primary after deferred validation');

set constraints admin_users_must_retain_primary deferred;

select throws_ok(
  $$do $test$
    begin
      update public.admin_users set role = 'standard'
        where user_id = '16000000-0000-0000-0000-000000000002';
      execute 'set constraints admin_users_must_retain_primary immediate';
    end
  $test$ $$,
  'P0001', 'PRIMARY_GUARD_ZERO',
  'the guard still rejects a transaction that would leave zero active primaries');

select is(
  (select count(*)::int from public.admin_users where role = 'primary' and is_active),
  1, 'rejected demotion leaves the active primary intact');

select * from finish();
rollback;
