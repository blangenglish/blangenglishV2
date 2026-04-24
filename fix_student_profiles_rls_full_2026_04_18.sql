-- ============================================================
-- ARREGLO DEFINITIVO: RLS student_profiles
-- Permite que cada usuario autenticado lea y edite SU propio perfil
-- ============================================================

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes para empezar limpio
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.student_profiles';
  END LOOP;
END $$;

-- 3. Recrear políticas limpias y correctas

-- SELECT: cada usuario puede leer su propio registro
CREATE POLICY "student_profiles_select_own"
  ON public.student_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: cada usuario puede actualizar su propio registro
CREATE POLICY "student_profiles_update_own"
  ON public.student_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: cada usuario puede insertar su propio registro (upsert)
CREATE POLICY "student_profiles_insert_own"
  ON public.student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin puede leer todos los perfiles
CREATE POLICY "student_profiles_admin_select"
  ON public.student_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin puede actualizar cualquier perfil
CREATE POLICY "student_profiles_admin_update"
  ON public.student_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 4. Asegurar que las columnas editables existen
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS education_other TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Verificar resultado
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_profiles' ORDER BY cmd;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'student_profiles'
ORDER BY ordinal_position;