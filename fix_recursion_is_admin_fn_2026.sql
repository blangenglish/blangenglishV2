
-- ── 1. Crear función is_admin() con SECURITY DEFINER ──────────────────────
-- SECURITY DEFINER ejecuta como superuser, sin pasar por RLS → rompe la recursión
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid() AND is_admin_only = true
  );
$$;

-- ── 2. Recrear políticas en student_profiles ──────────────────────────────
ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.student_profiles'; END LOOP;
END$$;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_own_select"   ON public.student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "sp_own_insert"   ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "sp_own_update"   ON public.student_profiles FOR UPDATE USING (auth.uid() = id);
-- Admin usa la función SECURITY DEFINER (sin recursión)
CREATE POLICY "sp_admin_select" ON public.student_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "sp_admin_update" ON public.student_profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "sp_admin_insert" ON public.student_profiles FOR INSERT WITH CHECK (public.is_admin());

-- ── 3. Recrear políticas en subscriptions ────────────────────────────────
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.subscriptions'; END LOOP;
END$$;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_own_select" ON public.subscriptions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sub_own_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sub_own_update" ON public.subscriptions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "sub_admin_select" ON public.subscriptions FOR SELECT USING (public.is_admin());
CREATE POLICY "sub_admin_update" ON public.subscriptions FOR UPDATE USING (public.is_admin());
CREATE POLICY "sub_admin_insert" ON public.subscriptions FOR INSERT WITH CHECK (public.is_admin());

-- ── 4. Recrear políticas en courses ──────────────────────────────────────
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.courses'; END LOOP;
END$$;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_published" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "courses_admin_select"     ON public.courses FOR SELECT USING (public.is_admin());
CREATE POLICY "courses_admin_insert"     ON public.courses FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "courses_admin_update"     ON public.courses FOR UPDATE USING (public.is_admin());
CREATE POLICY "courses_admin_delete"     ON public.courses FOR DELETE USING (public.is_admin());

-- ── 5. Recrear políticas en units ─────────────────────────────────────────
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'units' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.units'; END LOOP;
END$$;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_select_published" ON public.units FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = units.course_id AND c.is_published = true)
);
CREATE POLICY "units_admin_select" ON public.units FOR SELECT USING (public.is_admin());
CREATE POLICY "units_admin_insert" ON public.units FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "units_admin_update" ON public.units FOR UPDATE USING (public.is_admin());
CREATE POLICY "units_admin_delete" ON public.units FOR DELETE USING (public.is_admin());

-- ── 6. Recrear políticas en demás tablas ─────────────────────────────────
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_history' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.payment_history'; END LOOP;
END$$;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ph_own"   ON public.payment_history FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "ph_admin" ON public.payment_history FOR ALL USING (public.is_admin());

ALTER TABLE public.session_requests DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'session_requests' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.session_requests'; END LOOP;
END$$;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_own"   ON public.session_requests FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "sr_admin" ON public.session_requests FOR ALL USING (public.is_admin());

ALTER TABLE public.student_module_access DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_module_access' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.student_module_access'; END LOOP;
END$$;
ALTER TABLE public.student_module_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sma_own"   ON public.student_module_access FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "sma_admin" ON public.student_module_access FOR ALL USING (public.is_admin());

ALTER TABLE public.unit_completions DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_completions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.unit_completions'; END LOOP;
END$$;
ALTER TABLE public.unit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uc_own"   ON public.unit_completions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "uc_admin" ON public.unit_completions FOR SELECT USING (public.is_admin());

ALTER TABLE public.unit_progress DISABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_progress' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.unit_progress'; END LOOP;
END$$;
ALTER TABLE public.unit_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "up_own"   ON public.unit_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "up_admin" ON public.unit_progress FOR SELECT USING (public.is_admin());
