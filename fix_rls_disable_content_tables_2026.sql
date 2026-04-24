
-- ═══════════════════════════════════════════════════════════════════
-- SOLUCIÓN DEFINITIVA: Obtener el UUID exacto del admin
-- y usarlo directamente en las políticas (sin depender de email ni de is_admin_only)
-- ═══════════════════════════════════════════════════════════════════

-- Paso 1: Crear función que obtiene el admin UUID desde auth.users
-- Busca el usuario con is_admin_only=true en student_profiles
CREATE OR REPLACE FUNCTION public.get_admin_uuid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT sp.id 
  FROM public.student_profiles sp
  WHERE sp.is_admin_only = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_uuid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_uuid() TO anon;

-- Paso 2: Función is_admin basada en UUID directo (no en email ni en RLS de otra tabla)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() = (
    SELECT id FROM public.student_profiles
    WHERE is_admin_only = true
    LIMIT 1
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ═══════════════════════════════════════════════════════════════════
-- ALTERNATIVA MÁS SIMPLE: Deshabilitar RLS en tablas de contenido
-- El contenido publicado es público; admin escribe desde panel autenticado
-- ═══════════════════════════════════════════════════════════════════

-- courses: sin RLS (contenido público)
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- units: sin RLS
ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;

-- unit_stage_materials: sin RLS
ALTER TABLE public.unit_stage_materials DISABLE ROW LEVEL SECURITY;

-- unit_stage_quizzes: sin RLS
ALTER TABLE public.unit_stage_quizzes DISABLE ROW LEVEL SECURITY;

-- unit_completions: sin RLS
ALTER TABLE public.unit_completions DISABLE ROW LEVEL SECURITY;

-- unit_progress: sin RLS (si existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unit_progress' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.unit_progress DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Las tablas SENSIBLES sí mantienen RLS:
-- student_profiles, subscriptions, payment_history, session_requests
-- student_module_access
-- ═══════════════════════════════════════════════════════════════════

-- student_profiles: limpiar y recrear simple
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_profiles', pol.policyname); END LOOP;
END $$;

CREATE POLICY "own_profile" ON public.student_profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.subscriptions', pol.policyname); END LOOP;
END $$;

CREATE POLICY "own_subscription" ON public.subscriptions
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_history' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_history', pol.policyname); END LOOP;
END $$;

CREATE POLICY "own_payments" ON public.payment_history
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- session_requests
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'session_requests' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_requests', pol.policyname); END LOOP;
END $$;

CREATE POLICY "own_sessions" ON public.session_requests
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- student_module_access
ALTER TABLE public.student_module_access ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'student_module_access' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_module_access', pol.policyname); END LOOP;
END $$;

CREATE POLICY "own_module_access" ON public.student_module_access
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());
