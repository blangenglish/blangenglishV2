
-- Recrear tabla unit_stage_quizzes con políticas correctas

-- 1. Eliminar tabla si existe
DROP TABLE IF EXISTS public.unit_stage_quizzes CASCADE;

-- 2. Crear tabla
CREATE TABLE public.unit_stage_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(unit_id, stage)
);

-- 3. Habilitar RLS
ALTER TABLE public.unit_stage_quizzes ENABLE ROW LEVEL SECURITY;

-- 4. Política: cualquier usuario autenticado puede leer
CREATE POLICY "quiz_select_authenticated" ON public.unit_stage_quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Política: cualquier usuario autenticado puede insertar
CREATE POLICY "quiz_insert_authenticated" ON public.unit_stage_quizzes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Política: cualquier usuario autenticado puede actualizar
CREATE POLICY "quiz_update_authenticated" ON public.unit_stage_quizzes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Política: cualquier usuario autenticado puede eliminar
CREATE POLICY "quiz_delete_authenticated" ON public.unit_stage_quizzes
  FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Permisos
GRANT ALL ON public.unit_stage_quizzes TO authenticated;
GRANT ALL ON public.unit_stage_quizzes TO service_role;

-- Verificar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'unit_stage_quizzes';
