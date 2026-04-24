import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronUp, Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthModal } from '@/lib/index';

interface FAQPageProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const ALL_FAQS = [
  // 🔰 General
  {
    id: 'q1', category: 'General',
    question: '¿Qué es BLANG English Academy?',
    answer: 'BLANG es una plataforma de aprendizaje de inglés en línea, diseñada especialmente para hispanohablantes. Ofrecemos cursos estructurados por unidades semanales, sesiones en vivo con profesores y práctica con inteligencia artificial, todo en un solo lugar.',
  },
  {
    id: 'q2', category: 'General',
    question: '¿Para quién está diseñado BLANG?',
    answer: 'BLANG está diseñado para hispanohablantes (cualquier país) que quieren aprender inglés de forma autónoma, efectiva y a su propio ritmo. No importa si eres principiante total o si ya tienes bases — tenemos desde el nivel A1 hasta C1.',
  },
  {
    id: 'q3', category: 'General',
    question: '¿En qué idioma son las clases?',
    answer: 'En los niveles A1 y A2, las explicaciones se dan en español como apoyo. A partir del nivel B1 hasta C1, el contenido es 100% en inglés para que te sumerjas en el idioma y aceleres tu fluidez.',
  },
  {
    id: 'q4', category: 'General',
    question: '¿Necesito instalar algún programa o app?',
    answer: 'No. BLANG funciona directamente desde tu navegador web (Chrome, Firefox, Safari, etc.). Solo necesitas acceso a internet. Puedes usar computador, tablet o celular.',
  },
  // 📚 Cursos y Metodología
  {
    id: 'q5', category: 'Cursos',
    question: '¿Cuántos cursos tiene BLANG?',
    answer: 'Actualmente BLANG ofrece 5 cursos: Inglés desde Cero (A1), Inglés Elemental (A2), Inglés Intermedio (B1), Intermedio Avanzado (B2) e Inglés Avanzado (C1). En total cubren desde el nivel principiante hasta el avanzado.',
  },
  {
    id: 'q6', category: 'Cursos',
    question: '¿Cómo funciona la metodología de las unidades?',
    answer: 'Cada unidad sigue un ciclo de 5 pasos: 1) Gramática — aprendes la estructura, 2) Vocabulario — amplías tu léxico, 3) Lectura — practicas comprensión escrita, 4) Escucha — entrenas tu oído, 5) Práctica con IA — conversas y escribes con inteligencia artificial para reforzar todo lo aprendido.',
  },
  {
    id: 'q7', category: 'Cursos',
    question: '¿Cuánto tiempo debo dedicar por semana?',
    answer: 'Recomendamos completar una unidad por semana, lo que equivale aproximadamente a 4 días de estudio de 30-45 minutos cada uno. Sin embargo, puedes ir a tu propio ritmo — más rápido o más despacio, sin presiones.',
  },
  {
    id: 'q8', category: 'Cursos',
    question: '¿Puedo saltar niveles si ya sé algo de inglés?',
    answer: 'Sí. Puedes elegir el nivel que corresponde a tus conocimientos actuales. Si no estás seguro, puedes empezar con el nivel A2 o B1 y avanzar o retroceder según te sientas cómodo.',
  },
  {
    id: 'q9', category: 'Cursos',
    question: '¿Me garantizan que aprenderé inglés?',
    answer: 'BLANG te ofrece todas las herramientas y el contenido necesario para aprender inglés. Sin embargo, el aprendizaje es un proceso autónomo — el estudiante es el responsable de su propio progreso. Los resultados dependen directamente de la constancia y práctica de cada persona. No garantizamos fluidez en un tiempo específico.',
  },
  // 💳 Precios y Pagos
  {
    id: 'q10', category: 'Precios',
    question: '¿Cuánto cuesta BLANG?',
    answer: 'El plan mensual cuesta $15 USD o $55,000 COP al mes. Puedes empezar gratis con 7 días de prueba.',
  },
  {
    id: 'q11', category: 'Precios',
    question: '¿Hay prueba gratis?',
    answer: 'Sí. Puedes probar BLANG gratis por 7 días. Al terminar los 7 días, si decides continuar, pagarás el valor del plan mensual: $15 USD o $55,000 COP.',
  },
  {
    id: 'q12', category: 'Precios',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos PayPal (disponible desde cualquier país del mundo) y PSE / Transferencia bancaria (para residentes en Colombia).',
  },
  {
    id: 'q13', category: 'Precios',
    question: '¿Se hacen reembolsos?',
    answer: 'No se realizan reembolsos una vez procesado el pago. Te recomendamos aprovechar los 7 días de prueba gratuita para conocer la plataforma antes de suscribirte. Si tienes algún problema técnico, escríbenos y lo resolveremos.',
  },
  {
    id: 'q14', category: 'Precios',
    question: '¿Puedo cancelar mi suscripción cuando quiera?',
    answer: 'Sí, puedes cancelar tu suscripción en cualquier momento. Tu acceso continuará hasta el final del período ya pagado y no se realizarán cargos adicionales.',
  },
  // 🎥 Sesiones en Vivo
  {
    id: 'q15', category: 'Sesiones',
    question: '¿Qué son las sesiones en vivo?',
    answer: 'Son clases 1 a 1 con un profesor de inglés a través de Google Meet. Puedes reservarlas de forma independiente, sin necesidad de tener una suscripción activa. Eliges el día, hora y tema que quieres practicar.',
  },
  {
    id: 'q16', category: 'Sesiones',
    question: '¿Cuánto cuesta una sesión en vivo?',
    answer: 'Cada sesión tiene un costo de $10 USD por hora. Puedes reservar múltiples sesiones a la vez y el enlace de pago te llegará por correo.',
  },
  {
    id: 'q17', category: 'Sesiones',
    question: '¿Cómo cancelo o reprogramo una sesión?',
    answer: 'Puedes cancelar o reprogramar una sesión con al menos 5 horas de anticipación enviándonos un mensaje. Si no se cancela con ese tiempo de anticipación o no se asiste, la sesión se considera realizada y no habrá reembolso.',
  },
  {
    id: 'q18', category: 'Sesiones',
    question: '¿Qué temas puedo trabajar en una sesión en vivo?',
    answer: 'Cualquier tema que desees: conversación general, pronunciación, vocabulario específico, gramática, inglés para negocios, preparación para exámenes (IELTS, TOEFL), entrevistas de trabajo en inglés, entre otros.',
  },
  {
    id: 'q19', category: 'Sesiones',
    question: '¿Las sesiones quedan grabadas?',
    answer: 'No, las sesiones no se graban de forma predeterminada. Si deseas una grabación, coméntalo al inicio de la sesión y el profesor podrá indicarte cómo hacerlo desde tu propia plataforma.',
  },
  // 🤖 Práctica con IA
  {
    id: 'q20', category: 'IA',
    question: '¿Qué es la práctica con IA?',
    answer: 'Es el quinto paso de cada unidad. Consiste en conversaciones escritas y orales con un asistente de inteligencia artificial que te ayuda a practicar lo aprendido en esa unidad, corrige tus errores y te da retroalimentación inmediata.',
  },
  {
    id: 'q21', category: 'IA',
    question: '¿La práctica con IA reemplaza las clases en vivo?',
    answer: 'No, son complementos. La IA te permite practicar en cualquier momento sin horarios, perfecta para reforzar el contenido. Las sesiones en vivo te dan la oportunidad de practicar con una persona real, con pronunciación natural y situaciones más espontáneas.',
  },
  // 🔒 Cuenta y Seguridad
  {
    id: 'q22', category: 'Cuenta',
    question: '¿Cómo creo mi cuenta?',
    answer: 'Haz clic en "Registrarse gratis" en la parte superior de la página, completa el formulario con tu nombre y correo electrónico y listo. Empezarás automáticamente tu prueba gratuita de 7 días.',
  },
  {
    id: 'q23', category: 'Cuenta',
    question: '¿Puedo compartir mi cuenta con otra persona?',
    answer: 'No. Cada cuenta es personal e intransferible. El acceso está vinculado a un solo usuario y compartir credenciales va en contra de nuestros Términos de Servicio.',
  },
  {
    id: 'q24', category: 'Cuenta',
    question: '¿Puedo compartir el material del curso?',
    answer: 'No. Todo el contenido de BLANG está protegido por derechos de autor. No está permitido compartir, copiar, distribuir ni reproducir el material de la plataforma sin autorización expresa por escrito.',
  },
  {
    id: 'q25', category: 'Cuenta',
    question: '¿Qué hago si olvidé mi contraseña?',
    answer: 'En la pantalla de inicio de sesión encontrarás la opción "¿Olvidaste tu contraseña?". Te enviaremos un enlace a tu correo para que puedas restablecerla de forma segura.',
  },
  // 📊 Progreso
  {
    id: 'q26', category: 'Progreso',
    question: '¿Cómo puedo ver mi progreso?',
    answer: 'En la sección "Mi Progreso" podrás ver las unidades completadas, tu racha de estudio, tiempo dedicado y estadísticas generales. El sistema registra automáticamente cada actividad que completas.',
  },
  {
    id: 'q27', category: 'Progreso',
    question: '¿BLANG garantiza que aprenderé en 6 meses?',
    answer: 'No. El tiempo para alcanzar fluidez varía mucho según la persona, sus bases previas y la constancia con la que estudie. BLANG te da todas las herramientas — el resultado depende de ti y de tu práctica diaria.',
  },
  // 📞 Soporte
  {
    id: 'q28', category: 'Soporte',
    question: '¿Cómo contacto al soporte?',
    answer: 'Puedes enviarnos un mensaje usando el formulario al final de esta misma página. También puedes escribirnos por WhatsApp o Instagram. Respondemos lo más pronto posible, generalmente en menos de 24 horas.',
  },
  {
    id: 'q29', category: 'Soporte',
    question: '¿En qué horario tienen soporte?',
    answer: 'Nuestro equipo revisa los mensajes de lunes a sábado. El tiempo de respuesta habitual es de 24 horas. Para urgencias relacionadas con sesiones en vivo, escríbenos por WhatsApp.',
  },
];

const CATEGORIES = ['Todas', 'General', 'Precios', 'IA', 'Cuenta', 'Soporte'];

const CONTACT_CATEGORIES = ['Pregunta', 'Petición', 'Queja', 'Reclamo'];

export default function FAQ({ isLoggedIn, onOpenAuth, onLogout, userName }: FAQPageProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [openId, setOpenId] = useState<string | null>(null);

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', category: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_FAQS.filter((faq) => {
      const matchesSearch = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      const matchesCat = activeCategory === 'Todas' || faq.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCategory]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { type: 'faq_contact', ...contactForm },
      });
      if (error) throw error;
      setSent(true);
      setContactForm({ name: '', email: '', category: '', subject: '', message: '' });
    } catch {
      setSendError('Hubo un problema al enviar. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* Hero */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            {/* LEFT — text + search */}
            <div>
              <span className="inline-block bg-white/10 text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 backdrop-blur mb-5">
                💬 Centro de Ayuda
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
                Preguntas<br />
                <span className="text-amber-400">Frecuentes</span>
              </h1>
              <p className="text-lg text-white/80 mb-5">
                Encuentra respuesta a las dudas más comunes sobre BLANG.
              </p>
              {/* Search bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  placeholder="Buscar pregunta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-5 text-base rounded-2xl border-2 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-amber-400 focus:bg-white/15"
                />
              </div>
            </div>

            {/* RIGHT — instructor */}
            <div className="hidden lg:flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={IMAGES.INSTRUCTOR_NOBG}
                  alt="Instructor BLANG"
                  className="w-56 h-56 md:w-64 md:h-64 object-contain"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(167,139,250,0.4))' }}
                />
                <motion.div
                  animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-2 -right-4 bg-white text-gray-900 rounded-2xl px-3 py-1.5 shadow-xl font-bold text-xs"
                >
                  💬 {ALL_FAQS.length} preguntas respondidas
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-4 bg-amber-400 text-black rounded-2xl px-3 py-1.5 shadow-xl font-extrabold text-xs"
                >
                  ⚡ Respuesta en 24h
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-background/80 text-muted-foreground border-border/50 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ list */}
      <section className="pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-2xl font-bold mb-2">No encontramos esa pregunta</h3>
                <p className="text-muted-foreground mb-8">
                  No hay resultados para "<strong>{search}</strong>". ¿Tienes una duda diferente?<br />
                  Cuéntanosla en el formulario de abajo y te respondemos.
                </p>
                <Button
                  variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
                  onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ir al formulario de contacto ↓
                </Button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {filtered.length} pregunta{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
                </p>
                {filtered.map((faq) => (
                  <motion.div
                    key={faq.id}
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-background/80 border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <button
                      className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
                      onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-0.5 shrink-0">{faq.category}</span>
                        <span className="font-semibold text-sm md:text-base leading-snug">{faq.question}</span>
                      </div>
                      <span className="shrink-0 mt-0.5 text-muted-foreground">
                        {openId === faq.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {openId === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-0 border-t border-border/30">
                            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Contact form */}
      <section id="contacto" className="py-20 bg-white/60">
        <div className="container mx-auto px-4 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold mb-2">¿No encontraste tu respuesta?</h2>
            <p className="text-muted-foreground">
              Cuéntanos tu duda y te responderemos lo más pronto posible. 💜
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-background rounded-3xl border border-primary/10 shadow-xl p-8"
          >
            {sent ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">¡Mensaje enviado!</h3>
                <p className="text-muted-foreground mb-6">
                  Recibimos tu mensaje y te responderemos a la brevedad posible a tu correo. 📧
                </p>
                <Button variant="outline" className="rounded-full" onClick={() => setSent(false)}>
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Tipo de mensaje *</Label>
                  <Select value={contactForm.category || 'none'} onValueChange={(v) => setContactForm(p => ({ ...p, category: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona el tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Selecciona el tipo...</SelectItem>
                      {CONTACT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-subject" className="text-sm font-semibold">Asunto *</Label>
                  <Input
                    id="c-subject" placeholder="Escribe el asunto de tu mensaje"
                    value={contactForm.subject} onChange={(e) => setContactForm(p => ({ ...p, subject: e.target.value }))}
                    required className="rounded-xl"
                  />
                </div>

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name" className="text-sm font-semibold">Nombre *</Label>
                    <Input
                      id="c-name" placeholder="Tu nombre"
                      value={contactForm.name} onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))}
                      required className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email" className="text-sm font-semibold">Correo *</Label>
                    <Input
                      id="c-email" type="email" placeholder="tucorreo@ejemplo.com"
                      value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))}
                      required className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-message" className="text-sm font-semibold">Tu pregunta o comentario *</Label>
                  <Textarea
                    id="c-message" placeholder="Cuéntanos con detalle tu duda, petición o comentario..."
                    value={contactForm.message} onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))}
                    required className="rounded-xl min-h-[120px]" rows={5}
                  />
                </div>

                {sendError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{sendError}</p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Te responderemos lo más pronto posible a tu correo electrónico 💜
                </p>

                <Button
                  type="submit" size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                  disabled={sending || !contactForm.category}
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Enviar mensaje
                    </span>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
