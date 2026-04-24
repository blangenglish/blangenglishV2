import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

interface TermsProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const LAST_UPDATED = '14 de abril de 2026';

export default function Terms({ isLoggedIn, onOpenAuth, onLogout, userName }: TermsProps) {
  const navigate = useNavigate();

  const sections = [
    {
      id: '1', title: '1. Aceptación de los Términos',
      content: `Al registrarte y usar BLANG English Academy ("BLANG", "la plataforma", "nosotros"), aceptas íntegramente estos Términos de Servicio. Si no estás de acuerdo con alguno de los términos aquí descritos, no debes utilizar la plataforma. El uso continuado de BLANG implica la aceptación plena de estas condiciones.`,
    },
    {
      id: '2', title: '2. Descripción del Servicio',
      content: `BLANG es una plataforma de aprendizaje de inglés en línea dirigida principalmente a hispanohablantes. Ofrece:\n\n• Cursos estructurados por unidades semanales (niveles A1 a C1)\n• Práctica con inteligencia artificial (IA)\n• Sesiones en vivo 1 a 1 con profesores a través de Google Meet\n• Herramientas de seguimiento de progreso\n\nTodos los servicios se prestan de forma digital a través del sitio web de BLANG.`,
    },
    {
      id: '3', title: '3. Registro y Cuenta de Usuario',
      content: `Para acceder a los servicios de BLANG debes crear una cuenta personal proporcionando información veraz, completa y actualizada. Cada cuenta es personal e intransferible — no está permitido compartir credenciales de acceso con terceros. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. BLANG se reserva el derecho de suspender o cancelar cuentas que violen estos términos.`,
    },
    {
      id: '4', title: '4. Aprendizaje Autónomo — Responsabilidad del Estudiante',
      content: `BLANG es una plataforma de aprendizaje 100% autónomo. Esto significa que el estudiante es el principal responsable de su propio proceso de aprendizaje. BLANG proporciona las herramientas, el contenido estructurado y el apoyo técnico necesario, pero el avance y los resultados dependen exclusivamente de la constancia, dedicación y práctica de cada usuario.\n\nNo se garantiza que el estudiante alcance un nivel específico de inglés en un tiempo determinado. El tiempo necesario para adquirir fluidez varía según las bases previas, el tiempo dedicado al estudio y la regularidad de la práctica de cada persona.\n\nEl hecho de suscribirse a BLANG no reemplaza la responsabilidad personal del aprendizaje. Si el estudiante no dedica tiempo suficiente a practicar, los resultados serán limitados independientemente de la calidad del contenido ofrecido.`,
    },
    {
      id: '5', title: '5. Precios, Pagos y Suscripciones',
      content: `Los precios vigentes están publicados en la página de precios de BLANG. Actualmente:\n\n• Plan Mensual: $15 USD o $55,000 COP por mes\n• Prueba gratuita: 7 días sin costo y sin tarjeta de crédito\n• Sesiones en vivo: $10 USD por hora (sin suscripción)\n\nLos pagos se procesan a través de PayPal o PSE / Transferencia bancaria. BLANG se reserva el derecho de modificar los precios con previo aviso. Los cambios de precio no afectarán períodos ya pagados.`,
    },
    {
      id: '6', title: '6. Política de Reembolsos',
      content: `BLANG no realiza reembolsos por suscripciones una vez procesado el pago. Recomendamos aprovechar la prueba gratuita de 7 días para conocer la plataforma antes de suscribirse.\n\nEn caso de problemas técnicos graves atribuibles a BLANG que impidan el uso del servicio, se evaluará cada caso de forma individual.\n\nPara sesiones en vivo: no se realizará reembolso si el estudiante no asiste a la sesión agendada o si cancela con menos de 5 horas de anticipación. Las sesiones no asistidas se consideran realizadas.`,
    },
    {
      id: '7', title: '7. Cancelación y Reprogramación de Sesiones en Vivo',
      content: `Las sesiones en vivo pueden cancelarse o reprogramarse con al menos 5 (cinco) horas de anticipación al horario agendado, enviando la solicitud por los canales de comunicación oficiales de BLANG.\n\nSi la cancelación se realiza con menos de 5 horas de anticipación, la sesión se considerará realizada y no habrá lugar a reembolso ni reprogramación sin costo adicional.\n\nSi el profesor no se presenta a la sesión por razones atribuibles a BLANG, se ofrecerá reprogramación o reembolso total de la sesión afectada.`,
    },
    {
      id: '8', title: '8. Propiedad Intelectual y Uso del Contenido',
      content: `Todo el contenido de BLANG —incluyendo pero no limitado a: lecciones, textos, imágenes, audios, videos, ejercicios, metodología, diseño gráfico y materiales de práctica— es propiedad exclusiva de BLANG English Academy y está protegido por las leyes de propiedad intelectual aplicables.\n\nQueda estrictamente prohibido:\n\n• Copiar, reproducir, distribuir o compartir el contenido sin autorización escrita previa\n• Publicar materiales de la plataforma en redes sociales, grupos de WhatsApp u otras plataformas\n• Usar el contenido con fines comerciales\n• Modificar o crear obras derivadas del material de BLANG\n\nEl incumplimiento de estas disposiciones podrá resultar en la suspensión inmediata de la cuenta y posibles acciones legales.`,
    },
    {
      id: '9', title: '9. Conducta del Usuario',
      content: `Al usar BLANG te comprometes a:\n\n• Usar la plataforma exclusivamente para fines de aprendizaje personal\n• No intentar acceder a áreas restringidas del sistema\n• No realizar actividades que puedan dañar, interrumpir o sobrecargar los servidores\n• Respetar a los profesores durante las sesiones en vivo\n• No grabar sesiones en vivo sin el consentimiento explícito del profesor\n• Proporcionar información veraz en los formularios y comunicaciones`,
    },
    {
      id: '10', title: '10. Disponibilidad del Servicio',
      content: `BLANG se esfuerza por mantener la plataforma disponible de manera continua. Sin embargo, pueden ocurrir interrupciones por mantenimiento, actualizaciones técnicas o causas de fuerza mayor. BLANG no se hace responsable por daños derivados de interrupciones temporales del servicio.\n\nNos reservamos el derecho de modificar, actualizar o discontinuar funcionalidades de la plataforma con previo aviso razonable.`,
    },
    {
      id: '11', title: '11. Limitación de Responsabilidad',
      content: `BLANG no garantiza resultados específicos de aprendizaje. La plataforma se ofrece "tal como está" para facilitar el aprendizaje autónomo del inglés. BLANG no será responsable por:\n\n• Falta de progreso debido a insuficiente práctica del estudiante\n• Pérdida de datos causada por fallos técnicos fuera de nuestro control\n• Incompatibilidad con dispositivos o navegadores no soportados\n• Daños indirectos o consecuentes derivados del uso de la plataforma`,
    },
    {
      id: '12', title: '12. Modificaciones a los Términos',
      content: `BLANG se reserva el derecho de actualizar estos Términos de Servicio en cualquier momento. Las modificaciones serán publicadas en esta página con la fecha de actualización. Si continúas usando la plataforma después de publicados los cambios, se considerará que aceptas los nuevos términos. Te recomendamos revisar esta página periódicamente.`,
    },
    {
      id: '13', title: '13. Legislación Aplicable',
      content: `Estos Términos de Servicio se rigen por las leyes de la República de Colombia. Cualquier disputa derivada del uso de BLANG será sometida a la jurisdicción de los tribunales competentes de Colombia.`,
    },
    {
      id: '14', title: '14. Contacto',
      content: `Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos a través del formulario de la sección de Preguntas Frecuentes o escribirnos directamente por nuestros canales de WhatsApp o Instagram.`,
    },
  ];

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/40 to-background pointer-events-none" />

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              📜 Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Términos de Servicio</h1>
            <p className="text-muted-foreground">Última actualización: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-10 text-sm text-foreground/80 leading-relaxed"
          >
            Por favor lee estos Términos de Servicio detenidamente antes de usar la plataforma BLANG English Academy. Al crear una cuenta o utilizar nuestros servicios, confirmas que has leído, comprendido y aceptado estos términos en su totalidad.
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-background/80 border border-border/50 rounded-2xl p-7"
              >
                <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {section.id}
                  </span>
                  {section.title.replace(`${section.id}. `, '')}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer links */}
          <div className="mt-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Tienes preguntas sobre estos términos?
            </p>
            <button
              onClick={() => navigate(ROUTE_PATHS.FAQ)}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
            >
              Ir a Preguntas Frecuentes →
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              También puedes revisar nuestra{' '}
              <button onClick={() => navigate(ROUTE_PATHS.PRIVACY)} className="text-primary hover:underline">
                Política de Privacidad
              </button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
