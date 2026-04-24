CREATE TABLE IF NOT EXISTS student_module_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID,
  unit_id UUID,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_module_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_module_access_select_own" ON student_module_access;
CREATE POLICY "student_module_access_select_own" ON student_module_access
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_student_module_access_student ON student_module_access(student_id);

SELECT 'student_module_access table ready' as result;