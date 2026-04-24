
-- Verificar columna is_admin_only existe en student_profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_profiles'
  AND column_name IN ('is_admin_only', 'account_status', 'account_enabled');

-- Verificar qué usuarios tienen is_admin_only = true
SELECT id, is_admin_only, account_status
FROM public.student_profiles
WHERE is_admin_only = true;

-- Verificar políticas activas en student_profiles
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'student_profiles' AND schemaname = 'public';
