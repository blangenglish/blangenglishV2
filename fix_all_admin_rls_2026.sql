
-- ── Función helper: verifica si el usuario actual es admin ──
-- (Para simplificar las políticas)

-- ── lessons ──────────────────────────────────────────────────────────────
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lessons' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.lessons'; END LOOP;
END$$;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Estudiantes activos pueden leer lecciones de cursos con acceso
CREATE POLICY "lessons_select_auth" ON public.lessons FOR SELECT USING (auth.uid() IS NOT NULL);
-- Admin puede todo
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── stages ──────────────────────────────────────────────────────────────
ALTER TABLE public.stages DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'stages' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.stages'; END LOOP;
END$$;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_select_auth" ON public.stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stages_admin_all" ON public.stages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── unit_completions ─────────────────────────────────────────────────────
ALTER TABLE public.unit_completions DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_completions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.unit_completions'; END LOOP;
END$$;
ALTER TABLE public.unit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uc_own" ON public.unit_completions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "uc_admin" ON public.unit_completions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── unit_progress ─────────────────────────────────────────────────────────
ALTER TABLE public.unit_progress DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_progress' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.unit_progress'; END LOOP;
END$$;
ALTER TABLE public.unit_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "up_own" ON public.unit_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "up_admin" ON public.unit_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── payment_history ───────────────────────────────────────────────────────
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_history' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.payment_history'; END LOOP;
END$$;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ph_own" ON public.payment_history FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "ph_admin" ON public.payment_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── session_requests ──────────────────────────────────────────────────────
ALTER TABLE public.session_requests DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'session_requests' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.session_requests'; END LOOP;
END$$;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_own" ON public.session_requests FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "sr_admin" ON public.session_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);

-- ── student_module_access ─────────────────────────────────────────────────
ALTER TABLE public.student_module_access DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_module_access' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.student_module_access'; END LOOP;
END$$;
ALTER TABLE public.student_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sma_own" ON public.student_module_access FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "sma_admin" ON public.student_module_access FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true)
);
