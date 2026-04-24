
-- Drop all existing policies on unit_stage_quizzes and recreate cleanly
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'unit_stage_quizzes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON unit_stage_quizzes', pol.policyname);
  END LOOP;
END $$;

-- Make sure RLS is enabled
ALTER TABLE unit_stage_quizzes ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to read quizzes
CREATE POLICY "quiz_select_authenticated"
  ON unit_stage_quizzes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow ALL authenticated users to insert quizzes (admin writes, students read)
CREATE POLICY "quiz_insert_authenticated"
  ON unit_stage_quizzes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow ALL authenticated users to update quizzes
CREATE POLICY "quiz_update_authenticated"
  ON unit_stage_quizzes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow ALL authenticated users to delete quizzes
CREATE POLICY "quiz_delete_authenticated"
  ON unit_stage_quizzes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Also grant table privileges to authenticated role just in case
GRANT ALL ON unit_stage_quizzes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
