
-- Ver el email exacto del usuario admin en auth.users
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;
