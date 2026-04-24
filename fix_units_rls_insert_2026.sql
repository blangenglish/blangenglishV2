
-- ─── 1. Recrear is_admin() con SECURITY DEFINER para saltar RLS al consultarla ───
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid()
      AND is_admin_only = true
  ) INTO result;
  RETURN COALESCE(result, false);
END;
$$;

-- Dar permisos de ejecución a todos los usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ─── 2. Limpiar TODAS las políticas de units ───────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'units' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.units', pol.policyname);
  END LOOP;
END $$;

-- ─── 3. Recrear políticas limpias para units ───────────────────────
-- Admins: acceso total (SELECT + INSERT + UPDATE + DELETE)
CREATE POLICY "admin_select_units" ON public.units
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_insert_units" ON public.units
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_units" ON public.units
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_units" ON public.units
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Estudiantes: solo ver publicadas
CREATE POLICY "student_select_units" ON public.units
  FOR SELECT TO authenticated
  USING (is_published = true);

-- ─── 4. Limpiar y recrear unit_stage_materials ─────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'unit_stage_materials' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.unit_stage_materials', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_usm" ON public.unit_stage_materials
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_insert_usm" ON public.unit_stage_materials
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_usm" ON public.unit_stage_materials
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_usm" ON public.unit_stage_materials
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "student_select_usm" ON public.unit_stage_materials
  FOR SELECT TO authenticated
  USING (is_published = true);

-- ─── 5. Limpiar y recrear unit_stage_quizzes ──────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'unit_stage_quizzes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.unit_stage_quizzes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_usq" ON public.unit_stage_quizzes
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_insert_usq" ON public.unit_stage_quizzes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_usq" ON public.unit_stage_quizzes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_usq" ON public.unit_stage_quizzes
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "student_select_usq" ON public.unit_stage_quizzes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.units u
    WHERE u.id = unit_stage_quizzes.unit_id AND u.is_published = true
  ));

-- ─── 6. Limpiar y recrear courses ─────────────────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_courses" ON public.courses
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_insert_courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_courses" ON public.courses
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_courses" ON public.courses
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "student_select_courses" ON public.courses
  FOR SELECT TO authenticated
  USING (is_published = true);
