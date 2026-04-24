-- Asegurar columnas trial en student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Asegurar columna trial_active en subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE;

-- Asegurar account_status tiene los valores correctos soportados
-- (no hay constraint, solo aseguramos la columna existe)
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';

-- Asegurar que RLS permite al usuario leer/escribir su propio perfil
DO $$
BEGIN
  -- Política SELECT para student_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_profiles' AND policyname = 'users_select_own_profile'
  ) THEN
    CREATE POLICY "users_select_own_profile" ON public.student_profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  -- Política UPDATE para student_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_profiles' AND policyname = 'users_update_own_profile'
  ) THEN
    CREATE POLICY "users_update_own_profile" ON public.student_profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Confirmar columnas existentes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'student_profiles'
ORDER BY ordinal_position;