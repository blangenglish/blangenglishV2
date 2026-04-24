-- Ver tablas que tienen relación con admin
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%admin%';

-- Ver columnas de admin_users
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- Ver is_admin_only en student_profiles
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name LIKE '%admin%';