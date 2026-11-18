-- Add scheduled publication support for department members.
alter table public.department_members
  add column if not exists scheduled_at timestamptz;

create index if not exists department_members_scheduled_at_idx
  on public.department_members (scheduled_at)
  where scheduled_at is not null;
