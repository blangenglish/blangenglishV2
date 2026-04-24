
-- Estructura de la tabla
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'unit_stage_quizzes'
ORDER BY ordinal_position;

-- Constraints (unique, primary key, etc.)
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.unit_stage_quizzes'::regclass;

-- Ver registros actuales
SELECT unit_id, stage, jsonb_array_length(questions::jsonb) as num_questions, updated_at
FROM public.unit_stage_quizzes
ORDER BY updated_at DESC
LIMIT 10;
