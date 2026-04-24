
-- Ver estructura de units
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units'
ORDER BY ordinal_position;

-- Ver cuántas unidades hay y cuáles tienen stages completos
SELECT u.id as unit_id, u.title, u.course_id,
       COUNT(DISTINCT up.stage) as stages_completed
FROM units u
LEFT JOIN unit_progress up ON up.unit_id = u.id AND up.completed = true
WHERE u.is_published = true
GROUP BY u.id, u.title, u.course_id
LIMIT 20;

-- Ver cuántos stages tiene cada unidad en total (con materiales)
SELECT u.id, u.title, 
       COUNT(DISTINCT usm.stage) as stages_with_content
FROM units u
LEFT JOIN unit_stage_materials usm ON usm.unit_id = u.id AND usm.is_published = true
WHERE u.is_published = true
GROUP BY u.id, u.title
LIMIT 20;
