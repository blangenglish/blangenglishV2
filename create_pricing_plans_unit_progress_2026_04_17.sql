
-- pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Plan Mensual',
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_usd NUMERIC NOT NULL DEFAULT 15,
  price_cop NUMERIC NOT NULL DEFAULT 60000,
  billing_period TEXT DEFAULT 'monthly',
  emoji TEXT DEFAULT '💳',
  cta_text TEXT DEFAULT 'Empezar ahora',
  badge TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar plan por defecto si no existe
INSERT INTO pricing_plans (name, slug, description, price_usd, price_cop, billing_period, emoji, cta_text, is_popular, is_published, features, sort_order)
VALUES (
  'Plan Mensual',
  'monthly',
  'Acceso completo a todos los cursos de inglés con tutorías personalizadas.',
  15,
  60000,
  'monthly',
  '🚀',
  'Iniciar prueba gratis 7 días',
  TRUE,
  TRUE,
  '[
    "Acceso a todos los niveles A1-C1",
    "Videos interactivos y materiales descargables",
    "Quizzes y ejercicios prácticos",
    "7 días de prueba gratis sin tarjeta de crédito",
    "Soporte vía WhatsApp"
  ]',
  1
)
ON CONFLICT (slug) DO NOTHING;

-- unit_progress table
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  course_slug TEXT,
  completed_units INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuraciones por defecto
INSERT INTO site_settings (key, value) VALUES
  ('paypal_email', ''),
  ('pse_bank', ''),
  ('pse_account_number', ''),
  ('pse_account_holder', ''),
  ('pse_account_type', '')
ON CONFLICT (key) DO NOTHING;

-- RLS para pricing_plans (lectura pública)
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'public_read_pricing_plans_2026'
  ) THEN
    CREATE POLICY "public_read_pricing_plans_2026" ON pricing_plans FOR SELECT USING (TRUE);
  END IF;
END $$;

-- RLS para site_settings (lectura pública, escritura solo admin via service_role)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'public_read_site_settings_2026'
  ) THEN
    CREATE POLICY "public_read_site_settings_2026" ON site_settings FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'authenticated_write_site_settings_2026'
  ) THEN
    CREATE POLICY "authenticated_write_site_settings_2026" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- RLS para unit_progress
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'unit_progress' AND policyname = 'student_manage_own_progress_2026'
  ) THEN
    CREATE POLICY "student_manage_own_progress_2026" ON unit_progress FOR ALL USING (auth.uid() = student_id);
  END IF;
END $$;
