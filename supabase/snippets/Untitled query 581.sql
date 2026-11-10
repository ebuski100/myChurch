select
  u.id,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  a.role,
  a.is_active,
  a.deactivated_at
from public.admin_users a
join auth.users u
  on u.id = a.user_id
where a.role = 'primary';