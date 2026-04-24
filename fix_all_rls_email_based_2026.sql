
-- ═══════════════════════════════════════════════════════════════
-- PASO 1: Crear función is_admin_email() basada en JWT (sin tocar student_profiles)
-- Esto evita cualquier recursión o fallo de RLS
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email') = 'blangenglishacademy@gmail.com';
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_email() TO anon;

-- ═══════════════════════════════════════════════════════════════
-- PASO 2: Reemplazar políticas de units con la nueva función
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'units' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.units', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_units" ON public.units
  FOR SELECT TO authenticated USING (public.is_admin_email());

CREATE POLICY "admin_insert_units" ON public.units
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_update_units" ON public.units
  FOR UPDATE TO authenticated
  USING (public.is_admin_email()) WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_delete_units" ON public.units
  FOR DELETE TO authenticated USING (public.is_admin_email());

CREATE POLICY "student_select_units" ON public.units
  FOR SELECT TO authenticated USING (is_published = true);

-- ═══════════════════════════════════════════════════════════════
-- PASO 3: Reemplazar políticas de courses
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_courses" ON public.courses
  FOR SELECT TO authenticated USING (public.is_admin_email());

CREATE POLICY "admin_insert_courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_update_courses" ON public.courses
  FOR UPDATE TO authenticated
  USING (public.is_admin_email()) WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_delete_courses" ON public.courses
  FOR DELETE TO authenticated USING (public.is_admin_email());

CREATE POLICY "student_select_courses" ON public.courses
  FOR SELECT TO authenticated USING (is_published = true);

-- ═══════════════════════════════════════════════════════════════
-- PASO 4: Reemplazar políticas de unit_stage_materials
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_stage_materials' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.unit_stage_materials', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_usm" ON public.unit_stage_materials
  FOR SELECT TO authenticated USING (public.is_admin_email());

CREATE POLICY "admin_insert_usm" ON public.unit_stage_materials
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_update_usm" ON public.unit_stage_materials
  FOR UPDATE TO authenticated
  USING (public.is_admin_email()) WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_delete_usm" ON public.unit_stage_materials
  FOR DELETE TO authenticated USING (public.is_admin_email());

CREATE POLICY "student_select_usm" ON public.unit_stage_materials
  FOR SELECT TO authenticated USING (is_published = true);

-- ═══════════════════════════════════════════════════════════════
-- PASO 5: Reemplazar políticas de unit_stage_quizzes
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'unit_stage_quizzes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.unit_stage_quizzes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_select_usq" ON public.unit_stage_quizzes
  FOR SELECT TO authenticated USING (public.is_admin_email());

CREATE POLICY "admin_insert_usq" ON public.unit_stage_quizzes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_update_usq" ON public.unit_stage_quizzes
  FOR UPDATE TO authenticated
  USING (public.is_admin_email()) WITH CHECK (public.is_admin_email());

CREATE POLICY "admin_delete_usq" ON public.unit_stage_quizzes
  FOR DELETE TO authenticated USING (public.is_admin_email());

CREATE POLICY "student_select_usq" ON public.unit_stage_quizzes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.units u
    WHERE u.id = unit_stage_quizzes.unit_id AND u.is_published = true
  ));

-- ═══════════════════════════════════════════════════════════════
-- PASO 6: También actualizar student_profiles para el admin
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_all_profiles" ON public.student_profiles
  FOR ALL TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

CREATE POLICY "student_own_profile" ON public.student_profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- PASO 7: Actualizar subscriptions, payment_history, session_requests
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

CREATE POLICY "student_own_subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "student_insert_subscription" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_history' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_history', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_all_payments" ON public.payment_history
  FOR ALL TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

CREATE POLICY "student_own_payments" ON public.payment_history
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "student_insert_payment" ON public.payment_history
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'session_requests' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_requests', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_all_sessions" ON public.session_requests
  FOR ALL TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

CREATE POLICY "student_own_sessions" ON public.session_requests
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_module_access' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_module_access', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "admin_all_module_access" ON public.student_module_access
  FOR ALL TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

CREATE POLICY "student_own_module_access" ON public.student_module_access
  FOR SELECT TO authenticated USING (student_id = auth.uid());
