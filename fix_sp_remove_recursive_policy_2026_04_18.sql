-- Eliminar la política que causa recursión infinita
DROP POLICY IF EXISTS "sp_admin_all" ON public.student_profiles;

-- Verificar que las políticas básicas funcionan bien
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_profiles' ORDER BY cmd;