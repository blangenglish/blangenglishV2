
-- 1. Asegurar columnas necesarias
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'pending';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Desactivar RLS temporalmente para limpiar políticas
ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar TODAS las políticas existentes en ambas tablas
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'student_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.student_profiles';
  END LOOP;

  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.subscriptions';
  END LOOP;
END$$;

-- 4. Rehabilitar RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Recrear políticas limpias para student_profiles
-- Usuario ve/edita su propio perfil
CREATE POLICY "sp_own_select" ON public.student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "sp_own_insert" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "sp_own_update" ON public.student_profiles FOR UPDATE USING (auth.uid() = id);

-- Admin (is_admin_only=true) ve y edita todos los perfiles
CREATE POLICY "sp_admin_select" ON public.student_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));
CREATE POLICY "sp_admin_update" ON public.student_profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));
CREATE POLICY "sp_admin_insert" ON public.student_profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));

-- 6. Recrear políticas limpias para subscriptions
CREATE POLICY "sub_own_select" ON public.subscriptions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sub_own_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sub_own_update" ON public.subscriptions FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "sub_admin_select" ON public.subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));
CREATE POLICY "sub_admin_update" ON public.subscriptions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));
CREATE POLICY "sub_admin_insert" ON public.subscriptions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles x WHERE x.id = auth.uid() AND x.is_admin_only = true));
