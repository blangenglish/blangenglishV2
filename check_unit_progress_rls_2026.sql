
-- Ver políticas actuales de unit_progress
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'unit_progress';

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'unit_progress'
ORDER BY ordinal_position;

-- Ver si RLS está habilitado
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'unit_progress';
