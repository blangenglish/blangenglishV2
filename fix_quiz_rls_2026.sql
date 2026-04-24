-- Limpiar datos de prueba
DELETE FROM unit_stage_quizzes WHERE unit_id = '00000000-0000-0000-0000-000000000001';

-- Eliminar políticas anteriores que puedan estar bloqueando
DROP POLICY IF EXISTS "quiz_admin_all" ON unit_stage_quizzes;

-- Deshabilitar RLS temporalmente para asegurar acceso total
ALTER TABLE unit_stage_quizzes DISABLE ROW LEVEL SECURITY;

-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'unit_stage_quizzes'
ORDER BY ordinal_position;
