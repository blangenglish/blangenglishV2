
-- Actualizar is_admin_only = true para el email correcto del admin
UPDATE public.student_profiles
SET 
  is_admin_only = true,
  account_status = 'active',
  account_enabled = true,
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'blangenglishlearning@blangenglish.com'
);

-- También por si acaso el email antiguo tenía el flag, quitárselo a otros
UPDATE public.student_profiles
SET is_admin_only = false
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'blangenglishacademy@gmail.com'
);

-- Confirmar
SELECT sp.id, au.email, sp.is_admin_only, sp.account_status, sp.full_name
FROM public.student_profiles sp
JOIN auth.users au ON au.id = sp.id
ORDER BY sp.is_admin_only DESC;
