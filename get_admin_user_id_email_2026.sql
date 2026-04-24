
-- Ver usuarios con is_admin_only = true y su email en auth
SELECT 
  au.id,
  au.email,
  sp.full_name,
  sp.is_admin_only,
  sp.account_status
FROM auth.users au
JOIN public.student_profiles sp ON sp.id = au.id
WHERE sp.is_admin_only = true
ORDER BY au.created_at;
