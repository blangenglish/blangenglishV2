
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'units')
ORDER BY tablename, policyname;
