
SELECT
  au.user_id,
  au.created_at,
  u.email,
  u.email_confirmed_at
FROM public.admin_users AS au
JOIN auth.users AS u
  ON u.id = au.user_id;
