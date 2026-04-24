
-- Ver definición de la función is_admin
SELECT 
  routine_name,
  routine_definition,
  security_type
FROM information_schema.routines
WHERE routine_name = 'is_admin' AND routine_schema = 'public';

-- Ver políticas en unit_stage_materials también
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('units', 'unit_stage_materials', 'unit_stage_quizzes', 'courses')
ORDER BY tablename, policyname;
