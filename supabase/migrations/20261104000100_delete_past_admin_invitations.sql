
begin;

-- Permanently deletes a historical invitation record.
-- Only the active primary administrator may call this function.
-- Live invitations cannot be deleted; they must first be revoked or expire.
-- This function never modifies auth.users or admin_users.

create or replace function public.delete_past_admin_invitation(
  p_invitation_id uuid
)
returns table (
  invitation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_caller uuid;
  v_row public.admin_invitations%rowtype;
begin
  v_caller := (select auth.uid());

  if v_caller is null then
    raise exception 'ADMIN_INVITE_UNAUTHENTICATED: no authenticated user'
      using errcode = 'P0001';
  end if;

  if p_invitation_id is null then
    raise exception 'ADMIN_INVITE_NOT_FOUND: invitation does not exist'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.admin_users caller
    where caller.user_id = v_caller
      and caller.role = 'primary'
      and caller.is_active
  ) then
    raise exception 'ADMIN_INVITE_NOT_PRIMARY: caller is not the active primary'
      using errcode = 'P0001';
  end if;

  -- Serialize deletion against concurrent acceptance and revocation.
  select *
    into v_row
    from public.admin_invitations ai
    where ai.id = p_invitation_id
    for update;

  if not found then
    raise exception 'ADMIN_INVITE_NOT_FOUND: invitation does not exist'
      using errcode = 'P0001';
  end if;

  -- A live invitation must be explicitly revoked or allowed to expire.
  if v_row.accepted_at is null
    and v_row.revoked_at is null
    and v_row.expires_at > now()
  then
    raise exception 'ADMIN_INVITE_STILL_PENDING: live invitations cannot be deleted'
      using errcode = 'P0001';
  end if;

  delete from public.admin_invitations ai
    where ai.id = p_invitation_id
    returning ai.id into invitation_id;

  return next;
end
$fn$;

revoke all on function public.delete_past_admin_invitation(uuid)
  from public, anon, authenticated;

grant execute on function public.delete_past_admin_invitation(uuid)
  to authenticated;

commit;
