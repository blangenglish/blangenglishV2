
-- Ver TODAS las políticas actuales en units
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'units'
ORDER BY cmd, policyname;
