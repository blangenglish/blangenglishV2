-- Confirmar manualmente todos los correos no confirmados
-- Esto permite ingresar sin necesidad de confirmar email
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- También confirmar el email de todos los usuarios existentes
UPDATE auth.users 
SET confirmed_at = NOW()
WHERE confirmed_at IS NULL;

SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  CASE WHEN email_confirmed_at IS NULL THEN 'NO CONFIRMADO ⚠️' ELSE 'Confirmado ✅' END AS status
FROM auth.users
ORDER BY created_at DESC;
