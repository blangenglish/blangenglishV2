-- Tabla para registrar solicitudes de prueba gratuita y descuentos
CREATE TABLE IF NOT EXISTS public.trial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT,
  student_email TEXT,
  message TEXT,
  request_type TEXT DEFAULT 'trial_7days',  -- 'trial_7days' | 'discount_50' | 'full_payment'
  status TEXT DEFAULT 'pending',             -- 'pending' | 'approved' | 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

-- Estudiantes pueden insertar sus propias solicitudes
CREATE POLICY "student_insert_trial_request_2026_04_17"
  ON public.trial_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id OR student_id IS NULL);

-- Estudiantes pueden ver sus propias solicitudes
CREATE POLICY "student_select_trial_request_2026_04_17"
  ON public.trial_requests FOR SELECT
  USING (auth.uid() = student_id);

-- Índice para búsqueda por estudiante
CREATE INDEX IF NOT EXISTS idx_trial_requests_student_id_2026 ON public.trial_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_trial_requests_status_2026 ON public.trial_requests(status);
