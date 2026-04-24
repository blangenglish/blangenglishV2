-- Ver columnas existentes en student_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_profiles'
ORDER BY ordinal_position;

-- Ver policies RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'student_profiles';

-- Ver un registro de ejemplo (sin datos sensibles)
SELECT id, full_name, phone, country, city, birthday, education_level, account_status
FROM public.student_profiles LIMIT 2;