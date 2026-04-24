-- Crear tabla dedicada para quizzes por etapa de unidad
CREATE TABLE IF NOT EXISTS unit_stage_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  stage TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, stage)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_unit_stage_quizzes_unit_stage 
  ON unit_stage_quizzes(unit_id, stage);

-- RLS
ALTER TABLE unit_stage_quizzes ENABLE ROW LEVEL SECURITY;

-- Admin puede hacer todo (sin restricción de rol para simplificar)
CREATE POLICY "quiz_admin_all" ON unit_stage_quizzes
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_unit_stage_quizzes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unit_stage_quizzes_updated_at ON unit_stage_quizzes;
CREATE TRIGGER trg_unit_stage_quizzes_updated_at
  BEFORE UPDATE ON unit_stage_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_unit_stage_quizzes_updated_at();
