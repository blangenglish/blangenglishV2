
-- Asegurarse que student_profiles tiene todas las columnas necesarias
ALTER TABLE student_profiles 
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS english_level TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS education_other TEXT,
  ADD COLUMN IF NOT EXISTS is_admin_only BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'pending_plan',
  ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'A1',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Asegurarse que subscriptions tiene todas las columnas
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS plan_slug TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Plan Mensual',
  ADD COLUMN IF NOT EXISTS amount_usd NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS approved_by_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Asegurarse que payment_history existe
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount_usd NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'none',
  notes TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurarse que student_module_access existe
CREATE TABLE IF NOT EXISTS student_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, unit_id)
);

-- Asegurarse que unit_completions existe
CREATE TABLE IF NOT EXISTS unit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurarse que session_requests tiene student_id
ALTER TABLE session_requests 
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS student_email TEXT,
  ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS weekly_plan BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_hours TEXT,
  ADD COLUMN IF NOT EXISTS weekly_schedule TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT;

-- RLS: permitir a admin (service_role) acceso total
-- payment_history: los estudiantes pueden ver su propio historial
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_history' AND policyname = 'student_read_own_payment_history_2026'
  ) THEN
    CREATE POLICY "student_read_own_payment_history_2026" ON payment_history
      FOR SELECT USING (auth.uid() = student_id);
  END IF;
END $$;

-- student_module_access: los estudiantes pueden ver su propio acceso
ALTER TABLE student_module_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_module_access' AND policyname = 'student_read_own_module_access_2026'
  ) THEN
    CREATE POLICY "student_read_own_module_access_2026" ON student_module_access
      FOR SELECT USING (auth.uid() = student_id);
  END IF;
END $$;

-- unit_completions: los estudiantes pueden ver y escribir sus propias completaciones
ALTER TABLE unit_completions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'unit_completions' AND policyname = 'student_manage_own_completions_2026'
  ) THEN
    CREATE POLICY "student_manage_own_completions_2026" ON unit_completions
      FOR ALL USING (auth.uid() = student_id);
  END IF;
END $$;
