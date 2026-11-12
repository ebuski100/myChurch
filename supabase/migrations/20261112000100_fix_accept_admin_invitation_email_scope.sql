
-- Fix v_caller_email scope in accept_admin_invitation.
-- Preserve the existing invitation validation and admin enrolment rules.

create or replace function public.accept_admin_invitation(
  p_token_hash text
)
returns table (
  admin_user_id uuid
)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_caller uuid;
  v_caller_email text;
  v_row public.admin_invitations%rowtype;
begin
  v_caller := (select auth.uid());

  if v_caller is null then
    raise exception 'ADMIN_INVITE_UNAUTHENTICATED: no authenticated user'
      using errcode = 'P0001';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'ADMIN_INVITE_INVALID: invitation is not valid'
      using errcode = 'P0001';
  end if;

  -- Serialize concurrent accepts of the same token.
  perform pg_advisory_xact_lock(
    hashtext('victorycity_admin_invite_accept:' || p_token_hash)
  );

  select *
    into v_row
    from public.admin_invitations ai
    where ai.token_hash = p_token_hash
    for update;

  if not found then
    raise exception 'ADMIN_INVITE_INVALID: invitation is not valid'
      using errcode = 'P0001';
  end if;

  if v_row.revoked_at is not null then
    raise exception 'ADMIN_INVITE_REVOKED: invitation was revoked'
      using errcode = 'P0001';
  end if;

  if v_row.accepted_at is not null then
    raise exception 'ADMIN_INVITE_ALREADY_ACCEPTED: invitation was already used'
      using errcode = 'P0001';
  end if;

  if v_row.expires_at <= now() then
    raise exception 'ADMIN_INVITE_EXPIRED: invitation has expired'
      using errcode = 'P0001';
  end if;

  -- Verify that the authenticated account owns the invited email.
  select lower(u.email)
    into v_caller_email
    from auth.users u
    where u.id = v_caller;

  if v_caller_email is distinct from v_row.email then
    raise exception 'ADMIN_INVITE_EMAIL_MISMATCH: invitation was sent to a different address'
      using errcode = 'P0001';
  end if;

  -- Never create a duplicate administrator record.
  if exists (
    select 1
    from public.admin_users au
    where au.user_id = v_caller
  ) then
    raise exception 'ADMIN_INVITE_ALREADY_ADMIN: account is already an administrator'
      using errcode = 'P0001';
  end if;

  insert into public.admin_users (
    user_id,
    role,
    is_active,
    created_by
  )
  values (
    v_caller,
    'standard',
    true,
    v_row.invited_by
  );

  update public.admin_invitations
    set accepted_at = now()
    where id = v_row.id;

  admin_user_id := v_caller;
  return next;
end
$fn$;

revoke all on function public.accept_admin_invitation(text)
  from public, anon, authenticated;

grant execute on function public.accept_admin_invitation(text)
  to authenticated;
