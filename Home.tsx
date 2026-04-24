import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { IMAGES } from '@/assets/images';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
};

interface HomeProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

const COURSES = [
  { id: 'c1', emoji: '🌱', title: 'Inglés desde Cero', level: 'A1 — Principiante', color: 'from-green-400/20 to-emerald-400/20 border-green-200', badge: 'bg-green-100 text-green-700', desc: 'Saludos, números, colores, familia y primeras conversaciones.' },
  { id: 'c2', emoji: '📗', title: 'Inglés Elemental', level: 'A2 — Elemental', color: 'from-teal-400/20 to-cyan-400/20 border-teal-200', badge: 'bg-teal-100 text-teal-700', desc: 'Amplía tu vocabulario y construye frases completas con confianza.' },
  { id: 'c3', emoji: '📘', title: 'Inglés Intermedio', level: 'B1 — Intermedio', color: 'from-blue-400/20 to-indigo-400/20 border-blue-200', badge: 'bg-blue-100 text-blue-700', desc: 'Conversaciones sobre el mundo, viajes y situaciones cotidianas.' },
  { id: 'c4', emoji: '📙', title: 'Intermedio Avanzado', level: 'B2 — Interm. Avanzado', color: 'from-purple-400/20 to-violet-400/20 border-purple-200', badge: 'bg-purple-100 text-purple-700', desc: 'Phrasal verbs, modismos y conversaciones fluidas.' },
  { id: 'c5', emoji: '🏆', title: 'Inglés Avanzado', level: 'C1 — Avanzado', color: 'from-amber-400/20 to-yellow-400/20 border-amber-200', badge: 'bg-amber-100 text-amber-700', desc: 'Debates, textos académicos y fluidez total.' },
];

const METHODOLOGY_STEPS = [
  { emoji: '✏️', title: 'Gramática', color: 'from-violet-500 to-purple-600' },
  { emoji: '📖', title: 'Vocabulario', color: 'from-blue-500 to-cyan-500' },
  { emoji: '📚', title: 'Lectura', color: 'from-teal-500 to-green-500' },
  { emoji: '🎧', title: 'Escucha', color: 'from-orange-500 to-amber-500' },
  { emoji: '🤖', title: 'Práctica con IA', color: 'from-pink-500 to-rose-500' },
];

export default function Home({ onOpenAuth, isLoggedIn }: HomeProps) {
  const [ctaEmail, setCtaEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth}>

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── PRICING HERO — FIRST SECTION ── */}
      <section id="pricing-hero" className="relative min-h-screen flex items-center overflow-hidden py-12 sm:py-16">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-amber-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10 w-full">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >

            {/* ── TÍTULO PRINCIPAL ── */}
            <motion.div variants={staggerItem} className="text-center mb-4 px-2">
              <span className="inline-flex items-center gap-2 bg-green-400/20 text-green-300 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-green-400/30 backdrop-blur mb-4 sm:mb-6">
                💡 Empieza gratis · 7 días sin costo
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
                Aprende{' '}
                <span className="text-amber-400">inglés</span>
              </h1>
              {/* Precio — mobile friendly */}
              {/* Precio — una sola línea en móvil */}
              <div className="mt-3 flex flex-col items-center gap-1">
                <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white/80 whitespace-nowrap">
                  por solo{' '}
                  <span className="text-white text-3xl sm:text-4xl md:text-5xl font-black">$15</span>
                  <span className="text-white/60 text-base sm:text-xl font-bold"> USD/mes</span>
                  {' '}<span className="bg-amber-400 text-black text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full align-middle whitespace-nowrap">o $55,000 COP</span>
                </p>
              </div>
              <p className="text-white/60 text-xs sm:text-base mt-2">
                Sin compromisos · <strong className="text-white">Cancela cuando quieras</strong>
              </p>
            </motion.div>

            {/* ── DOS TARJETAS DE PRECIOS ── */}
            <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">

              {/* ── PRUEBA GRATIS ── */}
              <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-3xl p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 hover:bg-white/15 transition-all duration-300 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-3xl sm:text-5xl flex-shrink-0">🎁</span>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white whitespace-nowrap">Prueba Gratis</h2>
                      <p className="text-white/65 text-xs font-medium truncate">7 días completamente gratis</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-2xl sm:text-4xl md:text-5xl font-black text-green-400 leading-none">GRATIS</p>
                    <p className="text-white/50 text-xs mt-0.5">7 días</p>
                  </div>
                </div>
                {/* Divider */}
                <div className="h-px bg-white/15" />
                {/* Features */}
                <ul className="space-y-2 sm:space-y-3 flex-1">
                  {[
                    '7 días completamente gratis',
                    'Acceso a todas las lecciones',
                    'Cancela en cualquier momento',
                    'Sin tarjeta de crédito requerida',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90 text-sm sm:text-base md:text-lg font-medium">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {/* CTA */}
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-extrabold text-base sm:text-xl py-4 sm:py-5 rounded-2xl transition-all shadow-lg shadow-green-500/40 mb-16 sm:mb-0"
                >
                  Empezar gratis ahora →
                </button>
              </div>

              {/* ── PLAN MENSUAL ── */}
              <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 shadow-2xl shadow-amber-400/40 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 sm:gap-5 h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-3xl sm:text-5xl flex-shrink-0">🚀</span>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-black whitespace-nowrap">Plan Mensual</h2>
                        <span className="inline-block bg-black/15 text-black text-xs font-extrabold px-3 py-1 rounded-full mt-1">🚀 Acceso completo</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-3xl sm:text-4xl md:text-5xl font-black text-black leading-none">$15</p>
                      <p className="text-black/60 text-xs sm:text-sm mt-0.5">USD / mes</p>
                    </div>
                  </div>
                  <p className="text-black/70 font-semibold text-sm sm:text-base -mt-1">o $55,000 COP al mes</p>
                  {/* Divider */}
                  <div className="h-px bg-black/15" />
                  {/* Features */}
                  <ul className="space-y-2 sm:space-y-3 flex-1">
                    {[
                      'Acceso completo a TODOS los cursos',
                      'Práctica con IA incluida',
                      'Seguimiento de progreso semanal',
                      'Soporte prioritario',
                      'Sin contratos anuales',
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-black text-sm sm:text-base md:text-lg font-semibold">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/20 flex items-center justify-center text-black text-xs font-black flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* CTA */}
                  <button
                    onClick={() => onOpenAuth?.('register')}
                    className="w-full bg-black hover:bg-gray-900 active:scale-[0.98] text-white font-extrabold text-base sm:text-xl py-4 sm:py-5 rounded-2xl transition-all shadow-xl"
                  >
                    ¡Inscribirte ahora! 🚀
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── FOOTER INFO ── */}
            <motion.div variants={staggerItem} className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 sm:px-6 py-3 w-full sm:flex-1">
                <p className="text-white/85 text-xs sm:text-sm text-center leading-relaxed">
                  ✅ Empieza gratis. Después continúa por <strong className="text-amber-300">$15 USD</strong> o <strong className="text-amber-300">$55,000 COP</strong> al mes.
                </p>
              </div>
              <div className="flex items-center gap-4 sm:gap-5 text-white/60">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">🅿️</span> PayPal</span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">🏦</span> PSE</span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">💳</span> Tarjeta</span>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── HERO ── */}
      <section id="hero" className="relative py-14 sm:py-20 md:py-28 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/8 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-7xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={staggerItem} className="text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/20">
                🎉 ¡7 días de prueba completamente gratis!
              </span>
            </motion.div>

            {/* TWO-COLUMN: headline+flags LEFT — 3 steps RIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">

              {/* LEFT — headline + flags */}
              <motion.div variants={staggerItem} className="flex flex-col gap-6 sm:gap-8">
                <div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                    <span className="italic text-foreground/70">&quot;Speak Up and</span><br />
                    <span className="text-primary">Stand Out</span><br />
                    <span className="italic text-foreground/70">with </span>
                    <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">BLANG&quot;</span>
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground font-medium mt-4 sm:mt-5">Aprende inglés desde ya 🌎</p>
                </div>

                {/* Diseñado para hispanohablantes */}
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-2">✨ Diseñado especialmente para hispanohablantes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Metodología intuitiva</strong> por unidades,{' '}
                    <strong className="text-foreground">clases en vivo</strong> y{' '}
                    <strong className="text-foreground">práctica real con IA</strong>. ¡Todo en un solo lugar!
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">🌟 ¡Sé parte de los primeros estudiantes de BLANG!</p>
              </motion.div>

              {/* RIGHT — 3 steps */}
              <motion.div variants={staggerItem} className="flex flex-col gap-3 sm:gap-4">
                <div className="mb-1">
                  <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest">🎯 Empieza en 3 pasos</span>
                </div>
                {[
                  { num: '01', emoji: '👤', title: 'Crea tu cuenta', desc: 'Regístrate gratis en segundos. Empieza con 7 días de prueba.', color: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-200/60' },
                  { num: '02', emoji: '📋', title: 'Elige tu nivel', desc: 'De A1 principiante a C1 avanzado. Empieza desde donde realmente estás.', color: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200/60' },
                  { num: '03', emoji: '🎓', title: '¡A aprender!', desc: 'Una unidad por semana: gramática, vocabulario, lectura, escucha y práctica con IA.', color: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200/60' },
                ].map((step) => (
                  <div key={step.num} className={`flex items-start gap-3 sm:gap-4 bg-gradient-to-br ${step.bg} border ${step.border} rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-white font-black text-base sm:text-lg">{step.num}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg sm:text-xl">{step.emoji}</span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="mt-2 w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white font-extrabold text-base sm:text-lg py-4 rounded-2xl transition-opacity shadow-lg shadow-primary/30"
                >
                  ¡Crear mi cuenta gratis! 🚀
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COURSES + METHODOLOGY combined ── */}
      <section id="cursos" className="py-14 sm:py-24">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInUp}
          >
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              📚 Nuestros Cursos
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3">Nuestros Cursos</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              5 niveles estructurados. Avanza a tu ritmo, <span className="font-semibold text-foreground">una unidad por semana</span>.
            </p>
          </motion.div>

          {/* Methodology strip */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="max-w-5xl mx-auto mb-10 sm:mb-14 bg-gradient-to-br from-primary/8 via-violet-50 to-purple-50 border-2 border-primary/25 rounded-3xl px-4 sm:px-10 py-6 sm:py-10 shadow-lg"
          >
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-block bg-primary/15 text-primary text-sm font-extrabold px-4 py-1.5 rounded-full mb-3">🧠 Nuestra metodología</span>
              <p className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-foreground">Metodología intuitiva</p>
              <p className="text-base sm:text-lg sm:text-xl font-bold text-primary mt-1">Ciclo de 5 pasos por cada unidad</p>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">Cada unidad sigue el mismo ciclo probado para que aprendas de forma natural y sin memorizar reglas</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {METHODOLOGY_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 bg-background/60 rounded-2xl p-3 sm:p-4 border border-border/30 shadow-sm">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl sm:text-3xl shadow-md`}>
                    {step.emoji}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-center leading-tight text-foreground">{step.title}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Paso {i + 1}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Course cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 max-w-7xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}
          >
            {COURSES.map((course) => (
              <motion.div
                key={course.id} variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`bg-gradient-to-br ${course.color} rounded-3xl p-5 sm:p-6 border hover:shadow-lg transition-all cursor-pointer flex flex-col`}
                onClick={() => onOpenAuth?.('register')}
              >
                <p className="text-3xl sm:text-4xl mb-3">{course.emoji}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${course.badge} mb-3 inline-block`}>
                  {course.level}
                </span>
                <h3 className="text-sm sm:text-base font-bold mb-2">{course.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">{course.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Language note */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
          >
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm font-medium text-green-700">
              🇪🇸 A1 y A2 — Explicaciones en español
            </div>
            <span className="text-muted-foreground font-bold hidden sm:block">→</span>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm font-medium text-blue-700">
              🇺🇸 B1 a C1 — 100% en inglés
            </div>
          </motion.div>

          {/* Saber más */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mt-6"
          >
            <button
              onClick={() => navigate(ROUTE_PATHS.METHODOLOGY)}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm sm:text-base group"
            >
              Saber más sobre nuestra metodología
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── CLASES 1 A 1 ── */}
      <section id="sesiones-vivo" className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}
          >
            {/* Badge + título */}
            <motion.div variants={fadeInUp} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-primary/20">
                🎥 Clases en vivo
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight mb-3 sm:mb-4">
                Clases{' '}
                <span className="text-primary">1 a 1</span>
                {' '}con<br className="hidden md:block" />{' '}nuestros profes
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto">
                Practica con un profe en vivo, a tu horario y a tu ritmo
              </p>
            </motion.div>

            {/* Cards de beneficios + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">

              {/* Columna izquierda: beneficios */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-5">
                {[
                  { icon: '🗓️', title: 'Tú eliges el horario', desc: 'Reserva la sesión cuando más te convenga, sin restricciones de días ni horas.' },
                  { icon: '🎯', title: 'Temas a la medida', desc: 'Trabaja exactamente lo que necesitas: gramática, conversación, pronunciación, negocios...' },
                  { icon: '💻', title: 'Google Meet', desc: 'Sesiones cómodas por videollamada, desde cualquier lugar del mundo.' },
                  { icon: '🔓', title: 'Sin matrícula obligatoria', desc: 'No necesitas el curso completo para reservar. Puedes contratar solo las horas que quieras.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-4 sm:gap-5 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm sm:text-base text-foreground mb-1">{item.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Columna derecha: tarjeta precio + CTA */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-6">
                {/* Tarjeta precio destacada */}
                <div className="relative bg-gradient-to-br from-primary via-violet-600 to-purple-700 rounded-3xl p-5 sm:p-8 text-white shadow-2xl shadow-primary/30 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl">👨‍🏫</div>
                      <div>
                        <p className="font-extrabold text-base sm:text-lg">Clase individual</p>
                        <p className="text-white/70 text-xs sm:text-sm">Con profesor nativo / bilingüe</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl sm:text-7xl font-black leading-none">$10</span>
                      <div className="mb-2 sm:mb-3">
                        <p className="text-white/90 font-bold text-base sm:text-lg">USD</p>
                        <p className="text-white/60 text-xs sm:text-sm">por hora</p>
                      </div>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6">o $45,000 COP por hora · Sin contratos</p>
                    <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8">
                      {[
                        '✓  Corrección en tiempo real',
                        '✓  Feedback personalizado',
                        '✓  Grabación de la sesión',
                        '✓  Cancela con 24h de anticipación',
                      ].map((f, i) => (
                        <li key={i} className="text-white/90 font-medium text-xs sm:text-sm">{f}</li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className="w-full bg-white text-primary hover:bg-white/90 font-extrabold text-base sm:text-lg py-5 sm:py-6 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                      onClick={() => navigate(ROUTE_PATHS.PRICING)}
                    >
                      Reservar sesión 📅
                    </Button>
                  </div>
                </div>

                {/* Nota de confianza */}
                <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                  <span className="text-2xl sm:text-3xl">⭐</span>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-foreground">Profes verificados</p>
                    <p className="text-xs text-muted-foreground">Nativos o bilingües con experiencia comprobada en enseñanza de inglés</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING REMINDER ── */}
      <section id="pricing" className="py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
          >
            <button
              onClick={() => navigate(ROUTE_PATHS.PRICING)}
              className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-base sm:text-lg group"
            >
              Ver información completa sobre precios
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-500" />
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}
          >
            <motion.p className="text-3xl sm:text-4xl mb-4" variants={staggerItem}>🚀</motion.p>
            <motion.h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-5 sm:mb-6 leading-tight" variants={staggerItem}>
              ¡Empieza hoy y cambia tu futuro!
            </motion.h2>
            <motion.p className="text-base sm:text-xl text-white/85 mb-3 sm:mb-4" variants={staggerItem}>
              ¡Sé parte de los primeros estudiantes de BLANG! Empieza gratis 7 días.
            </motion.p>
            <motion.p className="text-sm sm:text-lg text-white/70 mb-8 sm:mb-10" variants={staggerItem}>
              Empieza con <span className="font-bold text-white">7 días gratis</span> y luego solo $15 USD o $55,000 COP al mes 🚀
            </motion.p>
            <motion.div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full px-2" variants={staggerItem}>
              <Input
                type="email" placeholder="Tu correo electrónico 📧"
                value={ctaEmail} onChange={(e) => setCtaEmail(e.target.value)}
                className="bg-white/20 text-white placeholder:text-white/60 border-white/30 rounded-full focus:ring-white/50 backdrop-blur"
              />
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-7"
                onClick={() => onOpenAuth?.('register')}
              >
                ¡Empezar! 🎉
              </Button>
            </motion.div>
            <motion.p className="text-xs sm:text-sm text-white/60 mt-5" variants={staggerItem}>
              ✓ 7 días gratis &nbsp; ✓ Sin compromisos &nbsp; ✓ Cancela cuando quieras
            </motion.p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
