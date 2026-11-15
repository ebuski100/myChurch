-- Deferred guard checks must bypass admin_users RLS after an authenticated
-- transfer RPC returns. Change only the function's execution security; its
-- owner, body, search_path, and trigger remain unchanged.
do $migration$
begin
  if to_regprocedure('public.check_primary_retained()') is not null then
    execute 'alter function public.check_primary_retained() security definer';
  end if;
end
$migration$;
