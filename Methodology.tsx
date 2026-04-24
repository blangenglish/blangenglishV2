import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { IMAGES } from '@/assets/images';

interface MethodologyPageProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

const STEPS = [
  {
    number: '01',
    emoji: '📚',
    title: 'Gramática',
    color: 'from-purple-500 to-violet-600',
    bg: 'from-purple-50 to-violet-50 border-purple-200',
    tag: 'bg-purple-100 text-purple-700',
    desc: 'Aprendes las reglas del idioma de forma clara y en español. Sin tecnicismos complicados, con ejemplos reales del día a día.',
    details: [
      'Explicaciones 100% en español',
      'Reglas con ejemplos cotidianos',
      'Ejercicios de aplicación inmediata',
      'Comparación con el español para entender mejor',
    ],
  },
  {
    number: '02',
    emoji: '📖',
    title: 'Vocabulario',
    color: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50 border-blue-200',
    tag: 'bg-blue-100 text-blue-700',
    desc: 'Palabras y frases reales, organizadas por temas de tu vida: familia, trabajo, viajes, emociones. Aprendes lo que vas a usar.',
    details: [
      'Palabras agrupadas por temas prácticos',
      'Frases completas, no solo palabras sueltas',
      'Flashcards y repetición espaciada',
      'Pronunciación incluida en cada palabra',
    ],
  },
  {
    number: '03',
    emoji: '📰',
    title: 'Lectura',
    color: 'from-teal-500 to-cyan-600',
    bg: 'from-teal-50 to-cyan-50 border-teal-200',
    tag: 'bg-teal-100 text-teal-700',
    desc: 'Textos cortos y graduales: noticias, historias, diálogos. Lees para entender el contexto real del idioma y ampliar vocabulario naturalmente.',
    details: [
      'Textos adaptados a tu nivel',
      'Comprensión lectora con preguntas guía',
      'Vocabulario nuevo resaltado con traducción',
      'Temas interesantes: cultura, viajes, tecnología',
    ],
  },
  {
    number: '04',
    emoji: '🎧',
    title: 'Escucha',
    color: 'from-pink-500 to-rose-600',
    bg: 'from-pink-50 to-rose-50 border-pink-200',
    tag: 'bg-pink-100 text-pink-700',
    desc: 'Audio con hablantes nativos en situaciones reales. Entrenas tu oído para entender inglés natural, no solo el "inglés de academia".',
    details: [
      'Audios con acento americano y británico',
      'Velocidad ajustable para practicar',
      'Transcripciones para comparar',
      'Diálogos de la vida real: aeropuerto, restaurante, trabajo',
    ],
  },
  {
    number: '05',
    emoji: '🤖',
    title: 'Práctica con IA',
    color: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 to-orange-50 border-amber-200',
    tag: 'bg-amber-100 text-amber-700',
    desc: 'Practicas escritura y conversación con inteligencia artificial (ChatGPT). Correcciones instantáneas, sin vergüenza, a tu propio ritmo.',
    details: [
      'Conversaciones escritas con IA',
      'Corrección automática de gramática y estilo',
      'Practica oral: pronunciación y fluidez',
      'Disponible 24/7, sin horarios fijos',
    ],
  },
];

const UNITS = [
  { emoji: '📅', title: 'Una unidad por semana', desc: 'O cada 4 días si quieres avanzar más rápido. Tú decides el ritmo.' },
  { emoji: '🔁', title: 'Ciclo completo en cada unidad', desc: 'Cada unidad recorre los 5 pasos: gramática → vocabulario → lectura → escucha → IA.' },
  { emoji: '🎯', title: 'Progresivo y acumulativo', desc: 'Lo que aprendes en una unidad lo refuerzas en la siguiente. Nada se queda atrás.' },
  { emoji: '🌍', title: 'A1–A2 en español', desc: 'Los niveles iniciales usan el español como apoyo. A partir de B1, todo es 100% en inglés.' },
];

const LEVELS = [
  { level: 'A1', title: 'Desde Cero', emoji: '🌱', units: 27, desc: 'Saludos, números, colores, familia y primeras frases.', lang: '🇪🇸 Explicaciones en español', color: 'bg-green-100 text-green-700 border-green-200', langColor: 'bg-green-50 text-green-600' },
  { level: 'A2', title: 'Elemental', emoji: '📗', units: 5, desc: 'Frases completas, presente y pasado simple.', lang: '🇪🇸 Explicaciones en español', color: 'bg-teal-100 text-teal-700 border-teal-200', langColor: 'bg-teal-50 text-teal-600' },
  { level: 'B1', title: 'Intermedio', emoji: '📘', units: 10, desc: 'Conversaciones fluidas sobre el mundo y viajes.', lang: '🇺🇸 100% en inglés', color: 'bg-blue-100 text-blue-700 border-blue-200', langColor: 'bg-blue-50 text-blue-600' },
  { level: 'B2', title: 'Interm. Avanzado', emoji: '📙', units: 13, desc: 'Phrasal verbs, modismos y expresión avanzada.', lang: '🇺🇸 100% en inglés', color: 'bg-purple-100 text-purple-700 border-purple-200', langColor: 'bg-purple-50 text-purple-600' },
  { level: 'C1', title: 'Avanzado', emoji: '🏆', units: 15, desc: 'Debates, textos académicos y fluidez total.', lang: '🇺🇸 100% en inglés', color: 'bg-amber-100 text-amber-700 border-amber-200', langColor: 'bg-amber-50 text-amber-600' },
];

export default function Methodology({ isLoggedIn = false, onOpenAuth, onLogout, userName }: MethodologyPageProps) {
  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── HERO ── */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center"
            initial="hidden" animate="visible" variants={stagger}
          >
            {/* LEFT — text */}
            <div>
              <motion.div variants={fadeUp} className="mb-5">
                <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 backdrop-blur">
                  🧠 Así aprendemos inglés en BLANG
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
                Metodología<br />
                <span className="text-amber-400">intuitiva y progresiva</span> 🚀
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/80 max-w-xl mb-6">
                Diseñada especialmente para hispanohablantes. Sin memorizar listas aburridas. Aprendes inglés <strong className="text-white">usándolo desde el primer día</strong>.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-amber-400 hover:bg-amber-300 text-black rounded-full px-8 py-6 font-extrabold text-base shadow-lg shadow-amber-400/30"
                  onClick={() => onOpenAuth?.('register')}
                >
                  Empezar gratis ahora 🎉
                </Button>
                <Link to={ROUTE_PATHS.PRICING}>
                  <Button size="lg" variant="outline" className="rounded-full px-8 py-6 font-semibold text-base border-white/30 text-white hover:bg-white/10">
                    Ver precios 💰
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* RIGHT — instructor + pill cards */}
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-6">
              <div className="relative">
                <img
                  src={IMAGES.INSTRUCTOR_NOBG}
                  alt="Instructor BLANG"
                  className="w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.3))' }}
                />
                <motion.div
                  animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-2 -right-2 bg-white text-gray-900 rounded-2xl px-3 py-1.5 shadow-xl font-bold text-xs"
                >
                  🎓 5 pasos por unidad
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-2 bg-amber-400 text-black rounded-2xl px-3 py-1.5 shadow-xl font-extrabold text-xs"
                >
                  🤖 IA incluida
                </motion.div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {[{e:'✏️',t:'Gramática'},{e:'📖',t:'Vocabulario'},{e:'📚',t:'Lectura'},{e:'🎧',t:'Escucha'},{e:'🤖',t:'Práctica IA',w:true}].map(({e,t,w}) => (
                  <div key={t} className={`bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2.5 text-center ${w ? 'col-span-2' : ''}`}>
                    <span className="text-xl block mb-0.5">{e}</span>
                    <p className="text-white/90 text-xs font-semibold">{t}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA (4 pilares) ── */}
      <section className="py-16 bg-white/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">¿Cómo funciona?</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">El aprendizaje está organizado en <strong className="text-foreground">unidades semanales</strong> con un ciclo completo de 5 pasos</p>
            </motion.div>
            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {UNITS.map((u, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{u.emoji}</div>
                  <h3 className="font-bold mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 5 PASOS ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                El ciclo completo
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Los 5 pasos de cada unidad</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Cada unidad recorre este ciclo completo. Así el aprendizaje se vuelve natural y sólido.
              </p>
            </motion.div>

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={i % 2 === 0 ? fadeLeft : fadeRight}
                  className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 items-center`}
                >
                  {/* Icon side */}
                  <div className={`flex-shrink-0 w-full md:w-64 rounded-3xl bg-gradient-to-br ${step.bg} border-2 p-8 flex flex-col items-center text-center shadow-sm`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mb-3 shadow-lg`}>
                      {step.emoji}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${step.tag} mb-2`}>Paso {step.number}</span>
                    <h3 className="text-2xl font-extrabold">{step.title}</h3>
                  </div>

                  {/* Content side */}
                  <div className="flex-1 bg-background/80 border border-border/40 rounded-3xl p-7 shadow-sm">
                    <p className="text-base text-muted-foreground leading-relaxed mb-5">{step.desc}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                          </span>
                          <span className="text-sm text-foreground/80">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── NIVELES ── */}
      <section className="py-16 bg-purple-50/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">5 cursos, del A1 al C1</h2>
              <p className="text-muted-foreground text-lg">Empieza desde donde estás y avanza a tu ritmo. Cada curso aplica la misma metodología intuitiva.</p>
            </motion.div>

            {/* Language transition note */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2">
                <span className="text-lg">🇪🇸</span>
                <span className="text-sm font-semibold text-green-700">A1 y A2 — Español como apoyo</span>
              </div>
              <span className="text-muted-foreground font-bold text-lg hidden sm:block">→</span>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm font-semibold text-blue-700">B1 a C1 — 100% en inglés</span>
              </div>
            </motion.div>

            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {LEVELS.map((lv) => (
                <motion.div key={lv.level} variants={fadeUp}
                  className={`rounded-2xl border-2 p-5 bg-background/80 hover:shadow-md transition-shadow flex flex-col ${lv.color}`}
                >
                  <div className="text-3xl mb-2">{lv.emoji}</div>
                  <span className="text-xs font-bold uppercase tracking-wide">{lv.level}</span>
                  <h3 className="font-bold text-base mt-0.5 mb-1">{lv.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug mb-3 flex-1">{lv.desc}</p>
                  <span className="text-xs font-semibold block mb-2">{lv.units} unidades</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${lv.langColor} inline-block`}>
                    {lv.lang}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── LIVE CLASSES ── */}
      <section className="py-16 bg-white/70">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp}
              className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-10 text-center shadow-sm"
            >
              <div className="text-5xl mb-4">🎥</div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">¿Quieres practicar en vivo?</h2>
              <p className="text-muted-foreground text-base mb-2 max-w-xl mx-auto">
                Complementa tu aprendizaje con <strong className="text-foreground">sesiones 1 a 1 por Google Meet</strong> con un profesor nativo.
                45-60 min, paga por sesión.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                💵 $10 USD &nbsp;·&nbsp; 💰 $35,000 COP &nbsp;·&nbsp; Sin suscripción
              </p>
              <Link to={ROUTE_PATHS.PRICING}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5 font-bold">
                  Ver detalles de la Clase en Vivo →
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-violet-700" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">🎓</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              ¡Empieza a aprender hoy!
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8">
              7 días gratis. Una metodología diseñada para que de verdad aprendas inglés. 💜
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('register')}
              >
                Registrarse gratis 🎉
              </Button>
              <Link to={ROUTE_PATHS.PRICING}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg"
                >
                  Ver precios
                </Button>
              </Link>
            </motion.div>

            {/* Breadcrumb links */}
            <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-4 text-white/60 text-sm">
              <Link to={ROUTE_PATHS.HOME} className="hover:text-white transition-colors">🏠 Inicio</Link>
              <span>·</span>
              <Link to={ROUTE_PATHS.PRICING} className="hover:text-white transition-colors">💰 Precios</Link>
              <span>·</span>
              <span className="text-white/90 font-semibold">🧠 Metodología</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
