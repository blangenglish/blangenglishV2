import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, User, Mail, Phone, Send, Plus, Trash2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePricingPlans, useSiteSettings } from '@/hooks/useSupabaseData';
import type { DBPricingPlan } from '@/lib/admin';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';

interface PricingPageProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
};

const PLAN_GRADIENTS: Record<string, string> = {
  prueba: 'from-green-50 to-emerald-50 border-green-200',
  mensual: 'from-primary/5 to-purple-50 border-primary/30',
  'clase-vivo': 'from-blue-50 to-indigo-50 border-blue-200',
};
const PLAN_BTN: Record<string, string> = {
  prueba: 'bg-green-500 hover:bg-green-600 text-white',
  mensual: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  'clase-vivo': 'bg-blue-600 hover:bg-blue-700 text-white',
};

function PlanCard({ plan, onSelect }: { plan: DBPricingPlan; onSelect: () => void }) {
  const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  const isFree = plan.price_usd === 0;
  const gradient = PLAN_GRADIENTS[plan.slug] ?? 'from-muted/30 to-muted/10 border-border/50';
  const btnClass = PLAN_BTN[plan.slug] ?? 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <motion.div variants={fadeUp} className="h-full">
      <div
        className={`relative h-full flex flex-col rounded-3xl border-2 bg-gradient-to-br ${gradient} p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
      >
        {plan.is_popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-primary/30">
              ⭐ Más Popular
            </span>
          </div>
        )}

        {plan.badge && (
          <div className="mb-3">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
              {plan.badge}
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className="text-4xl mb-3">{plan.emoji}</div>
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}

          <div className="mt-4">
            {isFree ? (
              <span className="text-4xl font-extrabold text-green-600">GRATIS</span>
            ) : (
              <div className="space-y-1">
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-extrabold">${plan.price_usd}</span>
                  <span className="text-muted-foreground mb-1.5 text-sm">USD/{plan.billing_period}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-foreground/70">
                    ${Number(plan.price_cop).toLocaleString('es-CO')}
                  </span>
                  <span className="text-muted-foreground text-sm">COP/{plan.billing_period}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <ul className="flex-1 space-y-3 mb-7">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground/80 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full rounded-xl py-6 font-bold text-sm ${btnClass}`}
          onClick={onSelect}
        >
          {plan.cta_text} →
        </Button>
      </div>
    </motion.div>
  );
}

interface SessionSlot { id: string; date: string; time: string; topic: string; }
interface BookingForm { name: string; lastName: string; email: string; phone: string; slots: SessionSlot[]; }
const SESSION_PRICE_USD = 10;

const FAQ = [
  { q: '¿Cuánto cuesta después de los días gratis?', a: 'Solo $15 USD ó $55,000 COP al mes. Sin contratos ni compromisos.' },
  { q: '¿Cómo puedo pagar?', a: 'Aceptamos transferencia bancaria o pago por PayPal. Escríbenos y te indicamos el método más conveniente para ti.' },
  { q: '¿Puedo cancelar cuando quiera?', a: '¡Claro! No hay contratos ni compromisos. Cancelas cuando quieras desde tu perfil, sin cargos ocultos.' },
  { q: '¿Las sesiones en vivo son incluidas?', a: 'Las sesiones 1 a 1 son un complemento opcional por $10 USD ó $35,000 COP por sesión, independiente de tu suscripción mensual.' },
  { q: '¿Hay compromiso al empezar?', a: 'No. Los días de prueba son completamente gratis y sin ningún compromiso. Cancelas cuando quieras.' },
];

export default function PricingPage({ isLoggedIn = false, onOpenAuth, onLogout, userName }: PricingPageProps) {
  const { data: plans, loading } = usePricingPlans();
  const { data: settings } = useSiteSettings();

  const trialDays = settings?.trial_days ?? '7';

  // Booking form state
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSent, setBookingSent] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: '', lastName: '', email: '', phone: '',
    slots: [{ id: '1', date: '', time: '', topic: '' }],
  });

  const addSlot = () => setBookingForm(prev => ({
    ...prev, slots: [...prev.slots, { id: Date.now().toString(), date: '', time: '', topic: '' }],
  }));
  const removeSlot = (id: string) => {
    if (bookingForm.slots.length === 1) return;
    setBookingForm(prev => ({ ...prev, slots: prev.slots.filter(s => s.id !== id) }));
  };
  const updateSlot = (id: string, field: keyof SessionSlot, value: string) => {
    setBookingForm(prev => ({ ...prev, slots: prev.slots.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  };
  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await supabase.functions.invoke('send-contact-email', {
        body: { type: 'booking', ...bookingForm, totalUSD: bookingForm.slots.length * SESSION_PRICE_USD },
      });
    } catch { /* silent */ } finally {
      setBookingLoading(false);
      setBookingSent(true);
    }
  };
  const totalUSD = bookingForm.slots.length * SESSION_PRICE_USD;

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>

      {/* PAGE BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* HERO */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.div variants={fadeUp} className="mb-5">
                <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 backdrop-blur">
                  💰 Precios claros, sin sorpresas
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
                Elige tu plan y<br />
                <span className="text-amber-400">empieza hoy gratis</span> 🎉
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/80 max-w-xl mb-4">
                {trialDays} días de prueba gratis. Luego solo <strong className="text-white">$15 USD</strong> ó <strong className="text-white">$55,000 COP</strong> al mes.
              </motion.p>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 bg-green-400/20 text-green-300 text-sm font-bold px-5 py-2 rounded-full border border-green-400/30">
                  ✅ {trialDays} días gratis · Sin compromisos · Cancela cuando quieras
                </span>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="flex flex-col items-center gap-5">
              <div className="relative">
                <img
                  src={IMAGES.INSTRUCTOR_NOBG}
                  alt="Instructor BLANG"
                  className="w-56 h-56 md:w-72 md:h-72 object-contain"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.3))' }}
                />
                <motion.div
                  animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-2 -right-2 bg-white text-gray-900 rounded-2xl px-3 py-1.5 shadow-xl font-bold text-xs"
                >
                  💰 $15 USD / mes
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-2 bg-amber-400 text-black rounded-2xl px-3 py-1.5 shadow-xl font-extrabold text-xs"
                >
                  🎁 {trialDays} días GRATIS
                </motion.div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {[{e:'🎁',t:'Prueba Gratis'},{e:'🚀',t:'Plan Mensual'},{e:'🎥',t:'Clases Vivo'}].map(({e,t}) => (
                  <div key={t} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-2 py-2.5 text-center">
                    <span className="text-xl block mb-0.5">{e}</span>
                    <p className="text-white/90 text-xs font-semibold leading-tight">{t}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-20 -mt-4">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start"
              initial="hidden" animate="visible" variants={stagger}
            >
              {(plans ?? []).filter(p => p.is_published).map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={() => onOpenAuth?.('register')} />
              ))}
            </motion.div>
          )}

          <motion.p
            className="text-center text-sm text-muted-foreground mt-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            ✅ {trialDays} días gratis &nbsp;·&nbsp; ✅ Sin compromisos &nbsp;·&nbsp; ✅ Sin contratos
          </motion.p>
        </div>
      </section>

      {/* HOW PAYMENT WORKS */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                💳 Pagos
              </span>
              <h2 className="text-3xl font-bold">¿Cómo funciona el pago?</h2>
              <p className="text-muted-foreground mt-2 text-sm">Proceso simple, sin sorpresas</p>
            </motion.div>
            <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
              {[
                { icon: '📝', step: '1', title: 'Regístrate gratis', desc: `Comienza con ${trialDays} días de acceso completo sin pagar nada.` },
                { icon: '💬', step: '2', title: 'Contáctanos', desc: 'Al terminar tu prueba, escríbenos y te indicamos cómo realizar el pago.' },
                { icon: '🚀', step: '3', title: 'Activa tu plan', desc: 'Confirmado el pago, activamos tu cuenta en máximo 24 horas hábiles.' },
              ].map(({ icon, step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="bg-background border border-border/40 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mx-auto mb-3">{step}</div>
                  <div className="text-3xl mb-2">{icon}</div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                📧 Escríbenos a{' '}
                <a href="mailto:blangenglishlearning@blangenglish.com" className="text-primary font-semibold hover:underline">
                  blangenglishlearning@blangenglish.com
                </a>
                {' '}— respondemos en máximo 24 horas hábiles.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LIVE CLASSES */}
      <section id="clases-vivo" className="py-16 bg-white/60">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                🎥 Clases en Vivo
              </span>
              <h2 className="text-3xl font-bold">Clases 1 a 1 con nuestros profes</h2>
              <p className="text-muted-foreground mt-2">Solo las horas y temas que decidas · Google Meet · $10 USD/hora</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-center gap-10 bg-background border border-blue-100 rounded-3xl p-8 shadow-sm">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-36 h-36 rounded-3xl overflow-hidden ring-4 ring-blue-200 shadow-xl">
                    <img src={IMAGES.INSTRUCTOR_NOBG} alt="Profe" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
                    Disponible
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">Tu profe · Google Meet · 1 a 1</p>
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-muted-foreground leading-relaxed mb-5">
                  Sin necesidad de tener el curso completo. Elige el día, la hora y el tema que quieras trabajar.
                  Clases <strong>personalizadas</strong> via Google Meet.
                </p>
                <Button size="lg"
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-5"
                  onClick={() => { setShowBooking(true); setBookingSent(false); }}
                >
                  Reservar sesión 📅
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {showBooking && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowBooking(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative bg-background rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="h-1.5 bg-gradient-to-r from-primary via-purple-400 to-pink-400 rounded-t-3xl" />
              <div className="p-7">
                <button onClick={() => setShowBooking(false)}
                  className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                {bookingSent ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h3>
                    <p className="text-muted-foreground mb-6">
                      Recibirás el <strong>link de pago</strong> en tu correo ({bookingForm.email}) en las próximas horas.
                    </p>
                    <Button variant="outline" className="rounded-full"
                      onClick={() => { setShowBooking(false); setBookingSent(false); setBookingForm({ name: '', lastName: '', email: '', phone: '', slots: [{ id: '1', date: '', time: '', topic: '' }] }); }}
                    >Cerrar</Button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-5">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-extrabold mb-1">Reserva tu sesión 🎤</h2>
                      <p className="text-sm text-muted-foreground">Completa los datos y te enviamos el link de pago</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="b-name" className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary" /> Nombre</Label>
                        <Input id="b-name" placeholder="Tu nombre" value={bookingForm.name} onChange={e => setBookingForm(p => ({ ...p, name: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="b-lastname" className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary" /> Apellidos</Label>
                        <Input id="b-lastname" placeholder="Tus apellidos" value={bookingForm.lastName} onChange={e => setBookingForm(p => ({ ...p, lastName: e.target.value }))} required className="rounded-xl" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="b-email" className="text-sm font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> Correo</Label>
                        <Input id="b-email" type="email" placeholder="tucorreo@ejemplo.com" value={bookingForm.email} onChange={e => setBookingForm(p => ({ ...p, email: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="b-phone" className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> Teléfono / WhatsApp</Label>
                        <Input id="b-phone" type="tel" placeholder="+57 300 000 0000" value={bookingForm.phone} onChange={e => setBookingForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3">
                        <p className="font-semibold text-sm text-primary">📅 Reserva una hora de clase</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" /> Fecha</Label>
                            <Input type="date" value={bookingForm.slots[0]?.date || ''} onChange={e => updateSlot(bookingForm.slots[0].id, 'date', e.target.value)} required className="rounded-xl text-sm" min={new Date().toISOString().split('T')[0]} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">🕐 Hora</Label>
                            <Input type="time" value={bookingForm.slots[0]?.time || ''} onChange={e => updateSlot(bookingForm.slots[0].id, 'time', e.target.value)} required className="rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">📝 Tema</Label>
                          <Input placeholder="Ej: Conversación, Pronunciación, Phrasal verbs..." value={bookingForm.slots[0]?.topic || ''} onChange={e => updateSlot(bookingForm.slots[0].id, 'topic', e.target.value)} required className="rounded-xl text-sm" />
                        </div>
                      </div>
                      {bookingForm.slots.slice(1).map((slot, i) => (
                        <div key={slot.id} className="bg-violet-50/70 border border-violet-200/60 rounded-2xl p-4 space-y-3 relative">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-primary">📅 Sesión extra #{i + 2}</p>
                            <button type="button" onClick={() => removeSlot(slot.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" /> Fecha</Label>
                              <Input type="date" value={slot.date} onChange={e => updateSlot(slot.id, 'date', e.target.value)} required className="rounded-xl text-sm" min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">🕐 Hora</Label>
                              <Input type="time" value={slot.time} onChange={e => updateSlot(slot.id, 'time', e.target.value)} required className="rounded-xl text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">📝 Tema</Label>
                            <Input placeholder="Ej: Business English, Gramática..." value={slot.topic} onChange={e => updateSlot(slot.id, 'topic', e.target.value)} required className="rounded-xl text-sm" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addSlot}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 rounded-2xl py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Añadir otra sesión
                      </button>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Son <strong>${SESSION_PRICE_USD} USD</strong> por hora</p>
                        <p className="text-2xl font-extrabold text-primary mt-1">Total: ${totalUSD} USD</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>📧 El link de pago</p>
                        <p>se te enviará al correo</p>
                      </div>
                    </div>
                    <Button type="submit" size="lg"
                      className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <span className="flex items-center gap-2">
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar solicitud</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-2xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-background border border-border/50 rounded-2xl px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-base font-semibold hover:no-underline py-5 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-500" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-2xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">🚀</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              ¡Empieza gratis hoy!
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8">
              {trialDays} días gratis. Luego solo $15 USD o $55,000 COP al mes 🎊
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('register')}
              >
                Registrarse gratis 🎉
              </Button>
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('login')}
              >
                Ya tengo cuenta
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
