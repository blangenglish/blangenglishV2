-- Confirmar email de todos los usuarios sin confirmar
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Ver estado actual de todos los usuarios
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  CASE WHEN email_confirmed_at IS NULL THEN 'NO CONFIRMADO ⚠️' ELSE 'Confirmado ✅' END AS status
FROM auth.users
ORDER BY created_at DESC;
