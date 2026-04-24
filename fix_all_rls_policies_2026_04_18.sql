-- =============================================
-- STUDENT_PROFILES: estudiantes leen/editan su propio perfil
-- =============================================
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_select_own" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_own" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert_own" ON student_profiles;

CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "student_profiles_update_own" ON student_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "student_profiles_insert_own" ON student_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- =============================================
-- SUBSCRIPTIONS: estudiantes leen su propia suscripcion
-- =============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;

CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- =============================================
-- PAYMENT_HISTORY: estudiantes leen su historial
-- =============================================
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_history_select_own" ON payment_history;
DROP POLICY IF EXISTS "payment_history_insert_own" ON payment_history;

CREATE POLICY "payment_history_select_own" ON payment_history
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "payment_history_insert_own" ON payment_history
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- =============================================
-- STUDENT_MODULE_ACCESS: estudiantes leen su acceso
-- =============================================
ALTER TABLE student_module_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_module_access_select_own" ON student_module_access;

CREATE POLICY "student_module_access_select_own" ON student_module_access
  FOR SELECT TO authenticated USING (student_id = auth.uid());

-- =============================================
-- STUDENT_PROGRESS: estudiantes leen/escriben su progreso
-- =============================================
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_progress_select_own" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert_own" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update_own" ON student_progress;

CREATE POLICY "student_progress_select_own" ON student_progress
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "student_progress_insert_own" ON student_progress
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_progress_update_own" ON student_progress
  FOR UPDATE TO authenticated USING (student_id = auth.uid());

SELECT 'RLS policies updated successfully' as result;