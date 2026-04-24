
-- ─── Asegurarse de que is_admin() existe y funciona correctamente ───
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid()
      AND is_admin_only = true
  );
$$;

-- ─── TABLA: units ───────────────────────────────────────────────────
-- Eliminar políticas existentes y recrear limpias
DROP POLICY IF EXISTS "Admin full access units"        ON public.units;
DROP POLICY IF EXISTS "Admin can insert units"         ON public.units;
DROP POLICY IF EXISTS "Admin can update units"         ON public.units;
DROP POLICY IF EXISTS "Admin can delete units"         ON public.units;
DROP POLICY IF EXISTS "Admins can manage units"        ON public.units;
DROP POLICY IF EXISTS "Admin manage units"             ON public.units;
DROP POLICY IF EXISTS "Published units visible"        ON public.units;
DROP POLICY IF EXISTS "Students can view published units" ON public.units;
DROP POLICY IF EXISTS "units_admin_all"                ON public.units;
DROP POLICY IF EXISTS "units_student_select"           ON public.units;

-- Asegurarse de que RLS está activo
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "units_admin_all" ON public.units
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Estudiantes: solo ver unidades publicadas
CREATE POLICY "units_student_select" ON public.units
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ─── TABLA: unit_stage_materials ────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access unit_stage_materials"    ON public.unit_stage_materials;
DROP POLICY IF EXISTS "Admin manage unit_stage_materials"         ON public.unit_stage_materials;
DROP POLICY IF EXISTS "Admins can manage unit_stage_materials"    ON public.unit_stage_materials;
DROP POLICY IF EXISTS "Students can view unit_stage_materials"    ON public.unit_stage_materials;
DROP POLICY IF EXISTS "unit_stage_materials_admin_all"            ON public.unit_stage_materials;
DROP POLICY IF EXISTS "unit_stage_materials_student_select"       ON public.unit_stage_materials;

ALTER TABLE public.unit_stage_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_stage_materials_admin_all" ON public.unit_stage_materials
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "unit_stage_materials_student_select" ON public.unit_stage_materials
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.id = unit_stage_materials.unit_id
        AND u.is_published = true
    )
  );

-- ─── TABLA: unit_stage_quizzes ──────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access unit_stage_quizzes"   ON public.unit_stage_quizzes;
DROP POLICY IF EXISTS "Admin manage unit_stage_quizzes"        ON public.unit_stage_quizzes;
DROP POLICY IF EXISTS "Admins can manage unit_stage_quizzes"   ON public.unit_stage_quizzes;
DROP POLICY IF EXISTS "Students can view unit_stage_quizzes"   ON public.unit_stage_quizzes;
DROP POLICY IF EXISTS "unit_stage_quizzes_admin_all"           ON public.unit_stage_quizzes;
DROP POLICY IF EXISTS "unit_stage_quizzes_student_select"      ON public.unit_stage_quizzes;

ALTER TABLE public.unit_stage_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_stage_quizzes_admin_all" ON public.unit_stage_quizzes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "unit_stage_quizzes_student_select" ON public.unit_stage_quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.id = unit_stage_quizzes.unit_id
        AND u.is_published = true
    )
  );

-- ─── TABLA: courses ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access courses"      ON public.courses;
DROP POLICY IF EXISTS "Admin manage courses"           ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses"      ON public.courses;
DROP POLICY IF EXISTS "Published courses visible"      ON public.courses;
DROP POLICY IF EXISTS "Students can view courses"      ON public.courses;
DROP POLICY IF EXISTS "courses_admin_all"              ON public.courses;
DROP POLICY IF EXISTS "courses_student_select"         ON public.courses;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_admin_all" ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "courses_student_select" ON public.courses
  FOR SELECT
  TO authenticated
  USING (is_published = true);
