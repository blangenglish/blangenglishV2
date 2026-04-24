
-- ══════════════════════════════════════════════════════════════
-- Asegura que el admin pueda modificar student_profiles y que
-- el estudiante vea sus propios datos actualizados
-- ══════════════════════════════════════════════════════════════

-- 1. student_profiles: políticas completas
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "student_profiles_select_own" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_own" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert_own" ON public.student_profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "service_role_all" ON public.student_profiles;

-- Estudiante ve y edita su propio perfil
CREATE POLICY "student_profiles_select_own" ON public.student_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "student_profiles_update_own" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "student_profiles_insert_own" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin puede ver y modificar todos los perfiles
CREATE POLICY "admin_select_all_profiles" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

CREATE POLICY "admin_update_all_profiles" ON public.student_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

-- service_role bypasa RLS automáticamente — no necesita política

-- 2. subscriptions: políticas completas
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;

-- Estudiante ve su propia suscripción
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = student_id);

-- Admin ve y modifica todas las suscripciones
CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

-- 3. student_module_access: políticas
ALTER TABLE public.student_module_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_access_select_own" ON public.student_module_access;
DROP POLICY IF EXISTS "admin_all_module_access" ON public.student_module_access;

CREATE POLICY "module_access_select_own" ON public.student_module_access
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "admin_all_module_access" ON public.student_module_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

-- 4. Asegurar que la columna account_enabled y onboarding_step existen
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS account_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS english_level text;

-- 5. Asegurar que subscriptions tiene account_enabled
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS account_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved_by_admin boolean DEFAULT false;

GRANT ALL ON public.student_profiles TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.student_module_access TO authenticated;
