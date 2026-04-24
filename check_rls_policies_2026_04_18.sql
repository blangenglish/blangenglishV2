-- Check existing policies
SELECT tablename, policyname, cmd, qual FROM pg_policies 
WHERE tablename IN ('student_profiles','subscriptions','payment_history','student_module_access','student_progress')
ORDER BY tablename, cmd;