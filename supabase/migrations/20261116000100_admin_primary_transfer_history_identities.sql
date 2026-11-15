-- Read-side helper for the transfer audit. Resolve Auth emails only for the
-- active primary who can access the transfer screen. LEFT JOINs preserve audit
-- entries for deleted Auth users.

create or replace function public.list_primary_transfer_history(
  p_limit integer default 10
)
returns table (
  id uuid,
  previous_primary_email text,
  new_primary_email text,
  transferred_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    t.id,
    previous_user.email::text as previous_primary_email,
    new_user.email::text as new_primary_email,
    t.transferred_at
  from public.admin_primary_transfers t
  left join auth.users previous_user
    on previous_user.id = t.previous_primary_id
  left join auth.users new_user
    on new_user.id = t.new_primary_id
  where exists (
    select 1
    from public.admin_users caller
    where caller.user_id = (select auth.uid())
      and caller.role = 'primary'
      and caller.is_active
  )
  order by t.transferred_at desc, t.id desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$fn$;

revoke all on function public.list_primary_transfer_history(integer)
  from public, anon, authenticated;
grant execute on function public.list_primary_transfer_history(integer)
  to authenticated;
