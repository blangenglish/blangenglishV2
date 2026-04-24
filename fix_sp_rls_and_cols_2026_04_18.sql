-- ============================================================
-- FIX RLS student_profiles + columnas faltantes
-- ============================================================

-- 1. Habilitar RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.student_profiles';
  END LOOP;
END $$;

-- 3. Política SELECT: leer propio perfil
CREATE POLICY "sp_select_own"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = id);

-- 4. Política UPDATE: editar propio perfil
CREATE POLICY "sp_update_own"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Política INSERT (upsert): crear propio perfil
CREATE POLICY "sp_insert_own"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Política admin: leer/editar perfil si is_admin_only=true
CREATE POLICY "sp_admin_all"
  ON public.student_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp2
      WHERE sp2.id = auth.uid() AND sp2.is_admin_only = true
    )
  );

-- 7. Agregar columnas faltantes si no existen
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS education_other TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 8. Verificar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_profiles' ORDER BY cmd;