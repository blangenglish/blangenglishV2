
-- ── Arreglar RLS de courses ──────────────────────────────────────────────

-- Deshabilitar temporalmente para limpiar
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes en courses
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.courses';
  END LOOP;
END$$;

-- Rehabilitar RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer cursos publicados
CREATE POLICY "courses_select_published" ON public.courses
  FOR SELECT USING (is_published = true);

-- Admin puede leer TODOS los cursos (publicados o no)
CREATE POLICY "courses_admin_select_all" ON public.courses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

-- Admin puede insertar, actualizar y eliminar cursos
CREATE POLICY "courses_admin_insert" ON public.courses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

CREATE POLICY "courses_admin_update" ON public.courses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

CREATE POLICY "courses_admin_delete" ON public.courses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );


-- ── Arreglar RLS de units ────────────────────────────────────────────────

ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'units' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.units';
  END LOOP;
END$$;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer unidades de cursos publicados
CREATE POLICY "units_select_published" ON public.units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = units.course_id AND c.is_published = true)
  );

-- Admin puede leer TODAS las unidades
CREATE POLICY "units_admin_select_all" ON public.units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

-- Admin puede insertar, actualizar y eliminar unidades
CREATE POLICY "units_admin_insert" ON public.units
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

CREATE POLICY "units_admin_update" ON public.units
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );

CREATE POLICY "units_admin_delete" ON public.units
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
  );
