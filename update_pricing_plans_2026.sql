-- Update pricing plans to correct prices: $15 USD / $55,000 COP
-- Remove old 50% OFF plans and update prices

-- First, delete old plans
DELETE FROM pricing_plans WHERE true;

-- Insert clean, updated plans
INSERT INTO pricing_plans (name, slug, description, price_usd, price_cop, billing_period, emoji, cta_text, badge, is_popular, is_published, features, sort_order)
VALUES
(
  '7 Días Gratis',
  'prueba',
  'Prueba sin riesgo — sin tarjeta de crédito',
  0,
  0,
  'prueba',
  '🎁',
  'Empezar gratis ahora',
  NULL,
  false,
  true,
  '["Acceso completo por 7 días","Todos los cursos A1 → C1","Práctica conversacional con IA","Sin tarjeta de crédito","Cancela cuando quieras"]',
  1
),
(
  'Plan Mensual',
  'mensual',
  'Acceso completo a toda la plataforma',
  15,
  55000,
  'mes',
  '🚀',
  'Inscribirme ahora',
  NULL,
  true,
  true,
  '["Acceso ilimitado a todos los cursos","Módulos A1, A2, B1, B2, C1","Práctica con IA en cada unidad","Comunidad de estudiantes","Cancela cuando quieras"]',
  2
),
(
  'Clases en Vivo',
  'clase-vivo',
  'Sesiones 1 a 1 con nuestros profesores',
  10,
  35000,
  'sesión',
  '🎥',
  'Reservar sesión',
  NULL,
  false,
  true,
  '["Sesión 1 a 1 por Google Meet","Profesor nativo o bilingüe","Duración: 1 hora","Pago por sesión sin suscripción","Cualquier tema o nivel"]',
  3
);
