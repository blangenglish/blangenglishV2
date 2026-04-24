-- Eliminar usuario de prueba creado durante el test
DELETE FROM auth.users WHERE email = 'test@test.com';
SELECT COUNT(*) as total_users FROM auth.users;