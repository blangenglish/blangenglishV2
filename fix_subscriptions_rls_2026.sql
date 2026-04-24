-- Revisar RLS actual en subscriptions
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- Asegurar que RLS está habilitado en subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: usuario puede ver sus propias suscripciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'users_select_own_subscription'
  ) THEN
    CREATE POLICY "users_select_own_subscription" ON public.subscriptions
      FOR SELECT USING (auth.uid() = student_id);
  END IF;
END $$;

-- Política: usuario puede insertar su propia suscripción (para activar trial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'users_insert_own_subscription'
  ) THEN
    CREATE POLICY "users_insert_own_subscription" ON public.subscriptions
      FOR INSERT WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- Política: usuario puede actualizar su propia suscripción
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'users_update_own_subscription'
  ) THEN
    CREATE POLICY "users_update_own_subscription" ON public.subscriptions
      FOR UPDATE USING (auth.uid() = student_id);
  END IF;
END $$;

-- Política: usuario puede eliminar su propia suscripción (para re-crear en trial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'users_delete_own_subscription'
  ) THEN
    CREATE POLICY "users_delete_own_subscription" ON public.subscriptions
      FOR DELETE USING (auth.uid() = student_id);
  END IF;
END $$;