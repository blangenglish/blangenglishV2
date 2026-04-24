
-- 1. Verificar políticas existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  RAISE NOTICE '=== Políticas en unit_progress ===';
  FOR pol IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'unit_progress'
  LOOP
    RAISE NOTICE 'Policy: % | CMD: % | QUAL: % | WITH_CHECK: %',
      pol.policyname, pol.cmd, pol.qual, pol.with_check;
  END LOOP;
END $$;

-- 2. Borrar políticas existentes para unit_progress
DROP POLICY IF EXISTS "Students can read own progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Students can insert own progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Students can upsert own progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Admins can read all progress" ON public.unit_progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.unit_progress;
DROP POLICY IF EXISTS "unit_progress_select" ON public.unit_progress;
DROP POLICY IF EXISTS "unit_progress_insert" ON public.unit_progress;
DROP POLICY IF EXISTS "unit_progress_update" ON public.unit_progress;
DROP POLICY IF EXISTS "unit_progress_delete" ON public.unit_progress;
DROP POLICY IF EXISTS "unit_progress_all" ON public.unit_progress;
-- Borrar cualquier otra política que pueda existir
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'unit_progress'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.unit_progress', pol.policyname);
  END LOOP;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.unit_progress ENABLE ROW LEVEL SECURITY;

-- 4. Política: estudiante puede leer su propio progreso
CREATE POLICY "up_select_own"
ON public.unit_progress
FOR SELECT
USING (auth.uid() = student_id);

-- 5. Política: estudiante puede insertar su propio progreso
CREATE POLICY "up_insert_own"
ON public.unit_progress
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- 6. Política: estudiante puede actualizar su propio progreso
CREATE POLICY "up_update_own"
ON public.unit_progress
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- 7. Política: admin puede leer todo
CREATE POLICY "up_admin_select"
ON public.unit_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid() AND is_admin_only = true
  )
);

-- 8. Política: admin puede modificar todo
CREATE POLICY "up_admin_all"
ON public.unit_progress
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE id = auth.uid() AND is_admin_only = true
  )
);

-- Confirmar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'unit_progress' ORDER BY policyname;
