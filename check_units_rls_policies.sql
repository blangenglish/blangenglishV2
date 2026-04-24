
-- Ver todas las políticas RLS de la tabla units
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'units'
ORDER BY policyname;
