
-- Ver si RLS está habilitado en estas tablas
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('courses', 'units', 'student_profiles', 'subscriptions')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
