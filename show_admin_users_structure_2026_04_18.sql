SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admin_users';

SELECT * FROM public.admin_users LIMIT 2;