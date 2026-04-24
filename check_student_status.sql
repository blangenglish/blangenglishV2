
-- Ver todos los estudiantes con su estado real
SELECT 
  sp.id,
  sp.full_name,
  sp.account_status,
  sp.account_enabled,
  sp.onboarding_step,
  sp.english_level,
  sp.is_admin_only,
  s.status as sub_status,
  s.approved_by_admin,
  s.account_enabled as sub_account_enabled,
  s.plan_slug
FROM student_profiles sp
LEFT JOIN subscriptions s ON s.student_id = sp.id
WHERE sp.is_admin_only IS NOT TRUE
ORDER BY sp.created_at DESC
LIMIT 20;
