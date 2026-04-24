import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface PlanSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

const PLANS = [
  {
    id: 'free_trial',
    emoji: '🌱',
    name: '7 Días Gratis',
    price: '$0',
    period: '7 días de prueba',
    badge: '',
    popular: false,
    features: [
      'Acceso completo por 7 días',
      'Todos los cursos A1 → C1',
      'Práctica con IA',
      'Cancela cuando quieras',
    ],
    cta: 'Empezar prueba gratis',
    amountUsd: 0,
    planSlug: 'free_trial',
    planName: '7 días gratis',
  },
  {
    id: 'monthly_50',
    emoji: '🚀',
    name: 'Plan Mensual',
    price: '$15 USD',
    period: 'mes',
    badge: '🚀 Acceso completo',
    popular: true,
    features: [
      'Acceso ilimitado a todos los cursos',
      'Clases en vivo con profesores',
      'Práctica con IA en cada unidad',
      'Cancela cuando quieras',
    ],
    cta: 'Inscribirme ahora',
    amountUsd: 15,
    planSlug: 'monthly',
    planName: 'Plan Mensual',
  },
];

export function PlanSelector({ open, onClose, userId, userName, userEmail }: PlanSelectorProps) {
  const [selected, setSelected] = useState('free_trial');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    const plan = PLANS.find(p => p.id === selected)!;

    // Save subscription to DB
    await supabase.from('subscriptions').upsert({
      student_id: userId,
      plan_slug: plan.planSlug,
      plan_name: plan.planName,
      status: plan.amountUsd === 0 ? 'trial' : 'active',
      amount_usd: plan.amountUsd,
    });

    // Send plan confirmation email
    if (plan.amountUsd > 0) {
      supabase.functions.invoke('send-welcome-email', {
        body: { type: 'plan_selected', name: userName, email: userEmail, plan: plan.planName },
      }).catch(() => {});
    }

    setLoading(false);
    setDone(true);
    setTimeout(() => {
      onClose();
      setDone(false);
    }, 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative bg-background rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div className="h-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400" />

            {done ? (
              <div className="p-10 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-extrabold mb-2">¡Listo, {userName}!</h2>
                  <p className="text-muted-foreground">Tu plan ha sido activado. ¡A aprender inglés!</p>
                </motion.div>
              </div>
            ) : (
              <div className="p-7">
                <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
                    🎯 Un último paso
                  </span>
                  <h2 className="text-2xl font-extrabold mb-1">Elige tu plan, {userName} 👋</h2>
                  <p className="text-sm text-muted-foreground">Puedes cambiar de plan cuando quieras</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelected(plan.id)}
                      className={`relative rounded-2xl p-5 text-left border-2 transition-all ${
                        selected === plan.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                          {plan.badge}
                        </span>
                      )}
                      {plan.popular && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-400 rounded-t-2xl" />
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-2xl">{plan.emoji}</span>
                          <h3 className="font-bold mt-1 text-sm">{plan.name}</h3>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          selected === plan.id ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {selected === plan.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-xl font-extrabold text-primary">{plan.price}</span>
                        <p className="text-xs text-muted-foreground">{plan.period}</p>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                            <span className="text-primary font-bold mt-0.5">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>

                {/* Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800 text-center">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  Si empieza con prueba gratis, al terminar los 7 días pagará el plan mensual ($15 USD o $55,000 COP).
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      {PLANS.find(p => p.id === selected)?.cta}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
