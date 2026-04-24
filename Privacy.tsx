import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

interface PrivacyProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const LAST_UPDATED = '14 de abril de 2026';

export default function Privacy({ isLoggedIn, onOpenAuth, onLogout, userName }: PrivacyProps) {
  const navigate = useNavigate();

  const sections = [
    {
      id: '1', title: '1. Responsable del Tratamiento de Datos',
      content: `BLANG English Academy es la entidad responsable del tratamiento de los datos personales que recopilas al usar nuestra plataforma. Puedes contactarnos a través del formulario disponible en la sección de Preguntas Frecuentes o por nuestros canales de comunicación oficiales (WhatsApp e Instagram).`,
    },
    {
      id: '2', title: '2. Datos que Recopilamos',
      content: `Recopilamos únicamente los datos necesarios para brindarte el servicio:\n\n• Datos de registro: nombre, apellido y correo electrónico\n• Datos de uso: progreso en los cursos, unidades completadas, tiempo de estudio\n• Datos de pago: procesados por terceros (PayPal o PSE) — BLANG no almacena datos de tarjetas de crédito\n• Datos de sesiones: nombre, correo, teléfono y horarios cuando reservas sesiones en vivo\n• Datos de comunicación: mensajes enviados a través de formularios de contacto`,
    },
    {
      id: '3', title: '3. Finalidad del Tratamiento',
      content: `Usamos tus datos para:\n\n• Crear y gestionar tu cuenta de usuario\n• Prestarte los servicios de aprendizaje contratados\n• Registrar y mostrar tu progreso de aprendizaje\n• Coordinar y confirmar sesiones en vivo\n• Enviarte comunicaciones relacionadas con el servicio (confirmaciones, recordatorios)\n• Responder a tus consultas y mensajes de soporte\n• Mejorar la plataforma y personalizar tu experiencia\n• Cumplir con obligaciones legales aplicables`,
    },
    {
      id: '4', title: '4. Base Legal del Tratamiento',
      content: `El tratamiento de tus datos se basa en:\n\n• La ejecución del contrato de servicio entre tú y BLANG al aceptar estos términos y registrarte\n• Tu consentimiento para comunicaciones comerciales (puedes retirarlo en cualquier momento)\n• El cumplimiento de obligaciones legales\n• El interés legítimo de BLANG para mejorar sus servicios`,
    },
    {
      id: '5', title: '5. Compartición de Datos con Terceros',
      content: `BLANG no vende ni alquila tus datos personales a terceros. Podemos compartir información limitada con:\n\n• Proveedores de pago (PayPal, PSE) para procesar transacciones — solo lo necesario para completar el pago\n• Proveedores de infraestructura tecnológica (Supabase para base de datos, servicios de email) bajo acuerdos de confidencialidad\n• Autoridades competentes cuando sea requerido por ley\n\nTodos los terceros con quienes compartimos datos están obligados a tratarlos con confidencialidad y solo para los fines indicados.`,
    },
    {
      id: '6', title: '6. Retención de Datos',
      content: `Conservamos tus datos mientras tu cuenta esté activa. Si cierras tu cuenta, eliminaremos o anonimizaremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales o fiscales.\n\nLos datos de transacciones y pagos pueden conservarse hasta 5 años por requisitos legales de Colombia.`,
    },
    {
      id: '7', title: '7. Seguridad de tus Datos',
      content: `Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos personales:\n\n• Transmisión cifrada mediante HTTPS/SSL\n• Almacenamiento seguro en servidores con control de acceso estricto\n• Políticas internas de acceso restringido a datos personales\n• Monitoreo regular de seguridad\n\nSin embargo, ningún sistema es 100% seguro. En caso de una brecha de seguridad que afecte tus datos, te notificaremos en el plazo legal correspondiente.`,
    },
    {
      id: '8', title: '8. Tus Derechos',
      content: `De acuerdo con la Ley 1581 de 2012 (Colombia) y las normativas aplicables, tienes derecho a:\n\n• Acceso: conocer qué datos tenemos sobre ti\n• Rectificación: corregir datos inexactos o incompletos\n• Cancelación/Supresión: solicitar la eliminación de tus datos cuando ya no sean necesarios\n• Oposición: oponerte al tratamiento de tus datos para fines específicos\n• Portabilidad: recibir tus datos en formato digital\n• Revocación del consentimiento: retirar tu consentimiento para comunicaciones en cualquier momento\n\nPara ejercer cualquiera de estos derechos, contáctanos a través de los canales oficiales de BLANG.`,
    },
    {
      id: '9', title: '9. Cookies y Tecnologías de Seguimiento',
      content: `BLANG puede usar cookies y tecnologías similares para:\n\n• Mantener tu sesión activa mientras usas la plataforma\n• Recordar tus preferencias de usuario\n• Analizar el uso de la plataforma para mejorar la experiencia\n\nPuedes configurar tu navegador para rechazar cookies, aunque esto puede afectar el funcionamiento de algunas funciones de la plataforma. No usamos cookies de terceros con fines publicitarios.`,
    },
    {
      id: '10', title: '10. Transferencias Internacionales de Datos',
      content: `Nuestros servidores pueden estar ubicados fuera de Colombia. Al usar BLANG, aceptas que tus datos puedan ser procesados en otros países, siempre bajo las medidas de seguridad descritas en esta política y de conformidad con la normativa aplicable de protección de datos.`,
    },
    {
      id: '11', title: '11. Datos de Menores de Edad',
      content: `BLANG no está dirigido a menores de 13 años. No recopilamos conscientemente datos de menores sin el consentimiento verificado de sus padres o tutores legales. Si eres padre o tutor y crees que tu hijo ha proporcionado datos a BLANG, contáctanos para eliminar esa información.`,
    },
    {
      id: '12', title: '12. Cambios en la Política de Privacidad',
      content: `Podemos actualizar esta Política de Privacidad periódicamente. Los cambios serán publicados en esta página con la fecha de actualización. Si los cambios son significativos, te notificaremos por correo electrónico o mediante un aviso destacado en la plataforma. El uso continuado de BLANG tras la publicación de cambios implica tu aceptación.`,
    },
    {
      id: '13', title: '13. Contacto sobre Privacidad',
      content: `Si tienes preguntas, comentarios o solicitudes relacionadas con el tratamiento de tus datos personales o esta Política de Privacidad, puedes contactarnos a través del formulario de la sección de Preguntas Frecuentes o por nuestros canales oficiales de comunicación.`,
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
              🔒 Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Política de Privacidad</h1>
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
            En BLANG English Academy nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política describe cómo recopilamos, usamos y protegemos tu información personal. Te recomendamos leerla con atención.
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
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
            <p className="text-sm text-muted-foreground">¿Tienes preguntas sobre esta política?</p>
            <button
              onClick={() => navigate(ROUTE_PATHS.FAQ)}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
            >
              Ir a Preguntas Frecuentes →
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              También puedes revisar nuestros{' '}
              <button onClick={() => navigate(ROUTE_PATHS.TERMS)} className="text-primary hover:underline">
                Términos de Servicio
              </button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
