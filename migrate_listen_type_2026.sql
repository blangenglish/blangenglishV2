
-- Migrar preguntas con type='listen' a 'listen_select' en unit_stage_quizzes
-- Las preguntas con opciones se convierten en listen_select, las sin opciones en listen_write

UPDATE unit_stage_quizzes
SET questions = (
  SELECT jsonb_agg(
    CASE
      WHEN (q->>'type') = 'listen' THEN
        CASE
          WHEN jsonb_array_length(q->'options') > 0
            THEN jsonb_set(q, '{type}', '"listen_select"')
            ELSE jsonb_set(q, '{type}', '"listen_write"')
        END
      ELSE q
    END
  )
  FROM jsonb_array_elements(questions) AS q
)
WHERE questions @> '[{"type":"listen"}]';
