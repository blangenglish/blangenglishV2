
-- 1. Asegurar que la columna account_status existe en student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'pending';

-- 2. Eliminar políticas RLS anteriores conflictivas y recrear las correctas

-- student_profiles
DROP POLICY IF EXISTS "admin_all_student_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "service_role_all" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.student_profiles;

-- Política: cada usuario ve/edita su propio perfil
CREATE POLICY "own_profile_select" ON public.student_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "own_profile_insert" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: admin (is_admin_only=true) puede leer y escribir todos los perfiles
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

-- subscriptions
DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "admin_update_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "own_subscription_select" ON public.subscriptions;
DROP POLICY IF EXISTS "own_subscription_update" ON public.subscriptions;
DROP POLICY IF EXISTS "own_subscription_insert" ON public.subscriptions;

CREATE POLICY "own_subscription_select" ON public.subscriptions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "own_subscription_update" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "own_subscription_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "admin_select_all_subs" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

CREATE POLICY "admin_update_all_subs" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

CREATE POLICY "admin_insert_all_subs" ON public.subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.is_admin_only = true
    )
  );

-- 3. Sincronizar account_status existente con account_enabled actual
UPDATE public.student_profiles
SET account_status = CASE
  WHEN account_enabled = false THEN 'disabled'
  WHEN trial_active = true THEN 'active_trial'
  WHEN account_status IS NULL OR account_status = 'pending' THEN 'pending'
  ELSE account_status
END
WHERE account_status IS NULL
   OR (account_enabled = false AND account_status != 'disabled');

-- 4. Confirmar que updated_at existe
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
