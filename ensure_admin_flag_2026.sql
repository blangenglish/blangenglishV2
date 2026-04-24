
-- Asegurar que el usuario con email blangenglishacademy@gmail.com
-- tiene is_admin_only = true en student_profiles
UPDATE public.student_profiles
SET 
  is_admin_only = true,
  account_status = 'active',
  account_enabled = true,
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'blangenglishacademy@gmail.com'
);

-- Verificar resultado
SELECT sp.id, au.email, sp.is_admin_only, sp.account_status
FROM public.student_profiles sp
JOIN auth.users au ON au.id = sp.id
WHERE au.email = 'blangenglishacademy@gmail.com';
