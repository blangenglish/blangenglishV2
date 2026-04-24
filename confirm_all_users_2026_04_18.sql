-- Confirmar todos los usuarios pendientes de confirmación
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verificar resultado
SELECT COUNT(*) as unconfirmed FROM auth.users WHERE email_confirmed_at IS NULL;
SELECT COUNT(*) as confirmed FROM auth.users WHERE email_confirmed_at IS NOT NULL;