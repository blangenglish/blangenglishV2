
-- Ver qué usuarios tienen is_admin_only = true
SELECT id, full_name, is_admin_only, account_status
FROM public.student_profiles
WHERE is_admin_only = true;
