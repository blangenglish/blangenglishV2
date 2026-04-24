
-- 1. Ver todos los registros en unit_progress
SELECT student_id, unit_id, stage, completed, completed_at
FROM unit_progress
ORDER BY completed_at DESC
LIMIT 30;

-- 2. Ver student_profiles con english_level
SELECT id, full_name, english_level
FROM student_profiles
LIMIT 10;

-- 3. Ver unidades publicadas
SELECT id, title, course_id, is_published
FROM units
WHERE is_published = true
LIMIT 20;

-- 4. Ver RLS policies en unit_progress
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'unit_progress';
