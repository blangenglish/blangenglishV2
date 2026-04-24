
-- Ver qué hay en unit_progress
SELECT unit_id, stage, completed, completed_at, student_id
FROM unit_progress
ORDER BY completed_at DESC
LIMIT 20;

-- Ver columnas de unit_progress
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'unit_progress'
ORDER BY ordinal_position;

-- Ver english_level values en student_profiles
SELECT id, english_level, full_name
FROM student_profiles
LIMIT 10;
