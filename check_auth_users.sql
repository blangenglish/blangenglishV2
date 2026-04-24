-- Verificar usuarios registrados en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' AS name,
  CASE WHEN email_confirmed_at IS NULL THEN 'NO CONFIRMADO ⚠️' ELSE 'Confirmado ✅' END AS email_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
