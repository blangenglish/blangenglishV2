-- 1. Columnas actuales de student_profiles
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_profiles'
ORDER BY ordinal_position;

-- 2. Políticas RLS actuales
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'student_profiles'
ORDER BY cmd;

-- 3. Un registro real
SELECT id, full_name, phone, country, city, birthday, education_level, account_status, updated_at
FROM public.student_profiles
LIMIT 3;