-- VictoryCity M1: admin primary seat columns, at-most-one index, mutation lock.
--
-- Schema only. Deterministic under ordinary `supabase db reset`.
-- No operator input. No row updates. No bootstrap. No at-least-one guard.
-- No recover_primary(). No custom GUC reads. No application changes.
--
-- Do NOT add bootstrap or guard-activation logic to this directory.
-- Bootstrap: supabase/manual/bootstrap_primary.sql (operator-run, explicit UUID).
-- Guard activation: supabase/manual/activate_primary_guard.sql (operator-run, after bootstrap).

begin;

alter table public.admin_users
  add column role text not null default 'standard'
    check (role in ('primary', 'standard')),
  add column is_active boolean not null default true,
  add column created_by uuid null references auth.users (id),
  add column deactivated_at timestamptz null,
  add column deactivated_by uuid null references auth.users (id),
  add constraint admin_users_active_needs_timestamp
    check (is_active or deactivated_at is not null);

-- At-most-one active primary. Immediate: blocks a transient second primary
-- at row time, even under concurrent promoters.
create unique index admin_users_single_active_primary
  on public.admin_users ((1))
  where role = 'primary' and is_active;

-- Bidirectional mutation lock. Fires when OLD was an active primary
-- (demotion, deactivation, delete, Auth cascade) OR NEW is becoming one
-- (promotion, insert). All seat mutations serialize on one advisory key.
create or replace function public.lock_primary_mutation()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if TG_OP = 'INSERT' then
    if NEW.role = 'primary' and NEW.is_active then
      perform pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.role = 'primary' and OLD.is_active then
      perform pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));
    end if;
    return OLD;
  else -- UPDATE
    if (OLD.role = 'primary' and OLD.is_active)
    or (NEW.role = 'primary' and NEW.is_active) then
      perform pg_advisory_xact_lock(hashtext('victorycity_admin_primary_singleton'));
    end if;
    return NEW;
  end if;
end $fn$;

drop trigger if exists admin_users_lock_primary_mutation on public.admin_users;
-- Predecessor name from an earlier draft; harmless if absent.
drop trigger if exists admin_users_lock_primary on public.admin_users;
drop function if exists public.lock_primary_singleton();

create trigger admin_users_lock_primary_mutation
  before insert or update or delete on public.admin_users
  for each row execute function public.lock_primary_mutation();

commit;
