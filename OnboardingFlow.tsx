import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, CheckCircle2, Send, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

// ─── Constants ───────────────────────────────────────────────────────────────
const AMOUNT_FULL_USD = 15;

const ENGLISH_LEVELS = [
  { value: 'A1', label: 'A1 — Principiante', desc: 'No sé nada o muy poco de inglés' },
  { value: 'A2', label: 'A2 — Básico', desc: 'Entiendo frases simples y vocabulario básico' },
  { value: 'B1', label: 'B1 — Intermedio', desc: 'Me comunico en situaciones cotidianas' },
  { value: 'B2', label: 'B2 — Intermedio alto', desc: 'Mantengo conversaciones con fluidez' },
  { value: 'C1', label: 'C1 — Avanzado', desc: 'Me expreso con precisión y espontaneidad' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type FlowState =
  | 'INITIAL'          // 2 opciones: trial / pago
  | 'TRIAL_FORM'       // Formulario solicitud 7 dias gratis
  | 'TRIAL_SENT'       // Confirmacion enviada
  | 'FULL_PAY_FORM'    // Formulario pago valor completo
  | 'PAYMENT_SENT'     // Confirmacion datos de pago enviados
  | 'LEVEL_CHOICE'     // Ya pagó: elegir entre "ya sé mi nivel" / "tomar examen"
  | 'LEVEL_SELECT'     // Seleccionar nivel manualmente
  | 'LEVEL_SAVED';     // Nivel guardado con éxito

type PayMethod = 'paypal' | 'pse';

interface OnboardingFlowProps {
  open: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  userCountry?: string;
  userCity?: string;
  userBirthdate?: string;
  onComplete: () => void;
  hasPaidPlan?: boolean;
  initialStep?: string;
  onOpenExam?: () => void;
}

// ─── Progress bar helper ──────────────────────────────────────────────────────
function progressFor(s: FlowState): number {
  const m: Record<FlowState, number> = {
    INITIAL: 10, TRIAL_FORM: 40, TRIAL_SENT: 90,
    FULL_PAY_FORM: 50, PAYMENT_SENT: 90,
    LEVEL_CHOICE: 30, LEVEL_SELECT: 60, LEVEL_SAVED: 100,
  };
  return m[s] ?? 10;
}

// ─── PayPal SVG icon ──────────────────────────────────────────────────────────
function PayPalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 inline mr-1 fill-current">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OnboardingFlow({
  open, userId, userName, userEmail,
  userCountry, userCity,
  onComplete, hasPaidPlan, initialStep, onOpenExam,
}: OnboardingFlowProps) {

  // Si ya pagó → ir directo a selección de nivel
  const getInit = (): FlowState => {
    if (hasPaidPlan) return 'LEVEL_CHOICE';
    if (initialStep === 'plan') return 'FULL_PAY_FORM';
    return 'INITIAL';
  };

  const [state, setState] = useState<FlowState>(getInit);
  const [payMethod, setPayMethod] = useState<PayMethod>('paypal');
  const [trialName, setTrialName] = useState(userName || '');
  const [trialEmail, setTrialEmail] = useState(userEmail || '');
  const [trialMessage, setTrialMessage] = useState('');
  const [payName, setPayName] = useState(userName || '');
  const [payEmail, setPayEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<FlowState[]>([getInit()]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [savingLevel, setSavingLevel] = useState(false);

  useEffect(() => {
    setTrialName(userName || '');
    setTrialEmail(userEmail || '');
    setPayName(userName || '');
    setPayEmail(userEmail || '');
  }, [userName, userEmail]);

  // Resetear al abrir, respetando hasPaidPlan
  useEffect(() => {
    if (open) {
      const s = getInit();
      setState(s);
      setHistory([s]);
      setTrialMessage('');
      setSelectedLevel('');
      setSavingLevel(false);
      setEmailError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasPaidPlan, initialStep]);

  const goTo = (next: FlowState) => {
    setHistory(h => [...h, next]);
    setState(next);
  };

  const goBack = () => {
    setHistory(h => {
      const prev = [...h];
      prev.pop();
      const target = prev[prev.length - 1] ?? 'INITIAL';
      setState(target);
      return prev;
    });
  };

  // ── Guardar nivel usando edge function con service_role ───────────────────
  const handleSaveLevel = async (level: string) => {
    setSavingLevel(true);
    setSelectedLevel(level);
    try {
      const { error } = await supabase.functions.invoke('save-onboarding-2026', {
        body: { action: 'save_level', student_id: userId, level, source: 'self_selected' },
      });
      if (error) {
        // Fallback directo si la edge function falla
        await supabase
          .from('student_profiles')
          .update({ english_level: level, onboarding_step: 'completed' })
          .eq('id', userId);
      }
      goTo('LEVEL_SAVED');
    } catch (_) {
      goTo('LEVEL_SAVED');
    } finally {
      setSavingLevel(false);
    }
  };

  // ── Ir al examen real ─────────────────────────────────────────────────────
  const handleGoToExam = async () => {
    try {
      const { error } = await supabase.functions.invoke('save-onboarding-2026', {
        body: { action: 'set_onboarding_step', student_id: userId, step: 'english_test' },
      });
      if (error) {
        await supabase
          .from('student_profiles')
          .update({ onboarding_step: 'english_test' })
          .eq('id', userId);
      }
    } catch (_) {}
    if (onOpenExam) {
      onOpenExam();
    } else {
      onComplete();
    }
  };

  // ── Enviar solicitud de prueba ────────────────────────────────────────────
  const handleSendTrialRequest = async () => {
    setLoading(true);
    setEmailError(null);
    try {
      const pais = userCountry || 'No especificado';
      const ciudad = userCity || 'No especificado';
      const msg = trialMessage.trim() ||
        'Hola, me gustaria solicitar los 7 dias gratis de BLANG English. ' +
        'Nombre: ' + trialName + '. Correo: ' + trialEmail +
        '. Pais: ' + pais + '. Ciudad: ' + ciudad + '.';

      try {
        await supabase.from('trial_requests').insert({
          student_id: userId || null,
          student_name: trialName,
          student_email: trialEmail,
          message: msg,
          request_type: 'trial_7days',
          status: 'pending',
        });
      } catch (_dbErr) {
        console.warn('DB history insert failed (non-fatal)', _dbErr);
      }

      try {
        const { error: edError } = await supabase.functions.invoke('send-trial-request-2026', {
          body: { userName: trialName, userEmail: trialEmail, message: msg, requestType: 'trial_request' },
        });
        if (edError) console.warn('[Email non-fatal]', edError);
      } catch (_emErr) {
        console.warn('[Email non-fatal]', _emErr);
      }

      goTo('TRIAL_SENT');
    } catch (err) {
      const msgErr = err instanceof Error ? err.message : String(err);
      setEmailError('Hubo un problema al enviar tu solicitud. Por favor intenta nuevamente. (Error: ' + msgErr + ')');
    } finally {
      setLoading(false);
    }
  };

  // ── Enviar datos de pago ──────────────────────────────────────────────────
  const handleSendPaymentRequest = async (requestType: string, amount: number) => {
    setLoading(true);
    setEmailError(null);
    try {
      const msg = 'Solicitud de ' + requestType + '. Nombre: ' + payName +
        '. Correo: ' + payEmail + '. Metodo de pago: ' + payMethod +
        '. Monto: $' + amount + ' USD.';

      try {
        const { error: edError2 } = await supabase.functions.invoke('send-trial-request-2026', {
          body: { userName: payName, userEmail: payEmail, message: msg, requestType },
        });
        if (edError2) console.warn('[Payment email non-fatal]', edError2);
      } catch (_payEmErr) {
        console.warn('[Payment email non-fatal]', _payEmErr);
      }

      goTo('PAYMENT_SENT');
    } catch (err) {
      const msgErr2 = err instanceof Error ? err.message : String(err);
      setEmailError('Hubo un problema al enviar tu solicitud. Por favor intenta nuevamente. (Error: ' + msgErr2 + ')');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const progress = progressFor(state);
  const canGoBack = history.length > 1 && !['TRIAL_SENT', 'PAYMENT_SENT', 'LEVEL_SAVED'].includes(state);

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={['TRIAL_SENT', 'PAYMENT_SENT', 'LEVEL_SAVED'].includes(state) ? onComplete : undefined}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            {canGoBack ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            ) : (
              <div className="w-16" />
            )}
            <button
              onClick={onComplete}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">

            {/* ── Vista para estudiantes que YA PAGARON ── */}
            {state === 'LEVEL_CHOICE' && (
              <div className="space-y-4 pt-1">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🎓</div>
                  <h2 className="font-extrabold text-2xl mb-1">Definir tu nivel</h2>
                  <p className="text-sm text-muted-foreground">
                    Tu cuenta está activa. Ahora define tu nivel de inglés para acceder a los cursos correspondientes.
                  </p>
                </div>

                {/* Opción 1: Ya sé mi nivel */}
                <button
                  className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 p-4 text-left transition-all group"
                  onClick={() => goTo('LEVEL_SELECT')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">📋</div>
                    <div className="flex-1">
                      <p className="font-bold text-base mb-0.5">Ya sé mi nivel</p>
                      <p className="text-xs text-muted-foreground">Selecciona directamente tu nivel de inglés (A1 a C1).</p>
                    </div>
                    <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">→</div>
                  </div>
                </button>

                {/* Opción 2: Tomar examen */}
                <button
                  className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-300 p-4 text-left transition-all group"
                  onClick={handleGoToExam}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">🧪</div>
                    <div className="flex-1">
                      <p className="font-bold text-base mb-0.5">Tomar examen de nivel</p>
                      <p className="text-xs text-muted-foreground">El sistema determinará tu nivel automáticamente con una prueba corta.</p>
                      <span className="inline-block mt-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">✅ Recomendado</span>
                    </div>
                    <div className="text-muted-foreground group-hover:text-emerald-600 transition-colors mt-1">→</div>
                  </div>
                </button>
              </div>
            )}

            {/* ── Selección manual de nivel ── */}
            {state === 'LEVEL_SELECT' && (
              <div className="space-y-3 pt-1">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">📋</div>
                  <h2 className="font-extrabold text-xl mb-1">Selecciona tu nivel</h2>
                  <p className="text-xs text-muted-foreground">Elige el nivel que mejor describe tu inglés actual.</p>
                </div>

                {savingLevel ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Guardando tu nivel...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ENGLISH_LEVELS.map(lvl => (
                      <button
                        key={lvl.value}
                        className="w-full rounded-2xl border-2 border-border/40 hover:border-primary/50 hover:bg-primary/5 p-3.5 text-left transition-all group"
                        onClick={() => handleSaveLevel(lvl.value)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-extrabold text-primary shrink-0">
                            {lvl.value}
                          </span>
                          <div>
                            <p className="font-bold text-sm">{lvl.label}</p>
                            <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                          </div>
                          <div className="ml-auto text-muted-foreground group-hover:text-primary transition-colors">→</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Nivel guardado con éxito ── */}
            {state === 'LEVEL_SAVED' && (
              <div className="text-center py-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto"
                >
                  ✅
                </motion.div>
                <div>
                  <h2 className="font-extrabold text-xl mb-2">¡Nivel guardado!</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Tu nivel <strong>{selectedLevel}</strong> fue configurado correctamente. Ya puedes acceder a tus cursos.
                  </p>
                </div>
                <Button className="w-full rounded-2xl py-4 font-bold" onClick={onComplete}>
                  Ir a mis cursos 🚀
                </Button>
              </div>
            )}

            {/* ── Vista inicial (sin plan pagado) ── */}
            {state === 'INITIAL' && (
              <InitialView
                userName={trialName}
                onSelectTrial={() => goTo('TRIAL_FORM')}
                onSelectFull={() => goTo('FULL_PAY_FORM')}
              />
            )}

            {state === 'TRIAL_FORM' && (
              <TrialFormView
                emailError={emailError}
                name={trialName}
                email={trialEmail}
                message={trialMessage}
                loading={loading}
                onNameChange={setTrialName}
                onEmailChange={setTrialEmail}
                onMessageChange={setTrialMessage}
                onSubmit={handleSendTrialRequest}
              />
            )}

            {state === 'TRIAL_SENT' && (
              <TrialSentView onClose={onComplete} />
            )}

            {state === 'FULL_PAY_FORM' && (
              <PaymentFormView
                emailError={emailError}
                title="Acceso con valor completo"
                subtitle={`$${AMOUNT_FULL_USD} USD/mes — Acceso total a todos los cursos`}
                badge="📚 PLAN COMPLETO"
                amount={AMOUNT_FULL_USD}
                name={payName}
                email={payEmail}
                payMethod={payMethod}
                loading={loading}
                copied={copied}
                setCopied={setCopied}
                onNameChange={setPayName}
                onEmailChange={setPayEmail}
                onMethodChange={setPayMethod}
                onSubmit={() => handleSendPaymentRequest('payment_request', AMOUNT_FULL_USD)}
              />
            )}

            {state === 'PAYMENT_SENT' && (
              <PaymentSentView onClose={onComplete} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function InitialView({
  userName,
  onSelectTrial,
  onSelectFull,
}: {
  userName: string;
  onSelectTrial: () => void;
  onSelectFull: () => void;
}) {
  return (
    <div className="space-y-4 pt-1">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">👋</div>
        <h2 className="font-extrabold text-2xl mb-1">
          ¡Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Elige cómo quieres comenzar tu experiencia en BLANG English.
        </p>
      </div>

      {/* Opcion 1: 7 dias gratis */}
      <button
        className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 p-4 text-left transition-all group"
        onClick={onSelectTrial}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">🎁</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-0.5">Solicitar 7 días gratis</p>
            <p className="text-xs text-muted-foreground">Sin pago. El equipo BLANG revisará tu solicitud y te contactará.</p>
            <span className="inline-block mt-1.5 text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">✉️ Solicitud manual</span>
          </div>
          <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">→</div>
        </div>
      </button>

      {/* Opcion 2: Pagar plan mensual */}
      <button
        className="w-full rounded-2xl border-2 border-green-200 bg-green-50/60 hover:bg-green-50 hover:border-green-300 p-4 text-left transition-all group"
        onClick={onSelectFull}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">💳</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-0.5">Pagar Plan Mensual</p>
            <p className="text-xs text-muted-foreground">$15 USD o $55,000 COP/mes. Acceso completo a todos los cursos.</p>
            <span className="inline-block mt-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">✅ Acceso inmediato</span>
          </div>
          <div className="text-muted-foreground group-hover:text-green-600 transition-colors mt-1">→</div>
        </div>
      </button>
    </div>
  );
}

function TrialFormView({
  name, email, message, loading, emailError,
  onNameChange, onEmailChange, onMessageChange, onSubmit,
}: {
  name: string;
  email: string;
  message: string;
  loading: boolean;
  emailError?: string | null;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 pt-1">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🎁</div>
        <h2 className="font-extrabold text-xl mb-1">Solicitar 7 días gratis</h2>
        <p className="text-xs text-muted-foreground">
          Completa el formulario y el equipo BLANG revisará tu solicitud. <strong>No se activa nada automáticamente.</strong>
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Nombre completo</Label>
          <Input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Tu nombre completo"
            className="rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Correo electrónico</Label>
          <Input
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="tu@correo.com"
            className="rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Mensaje (opcional)</Label>
          <Textarea
            value={message}
            onChange={e => onMessageChange(e.target.value)}
            placeholder="¿Por qué quieres aprender inglés con BLANG?"
            className="rounded-xl resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
        <p className="text-xs text-blue-700">
          ℹ️ <strong>Proceso manual:</strong> El equipo BLANG revisará tu solicitud y se comunicará contigo en máximo 48 horas hábiles para activar tu acceso de prueba.
        </p>
      </div>

      {emailError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3">
          <p className="text-xs text-red-700">{emailError}</p>
          <p className="text-xs text-red-600 mt-1">Si el problema persiste, escríbenos a <strong>blangenglishlearning@blangenglish.com</strong></p>
        </div>
      )}

      <Button
        className="w-full rounded-2xl py-5 font-bold text-base gap-2"
        onClick={onSubmit}
        disabled={loading || !name.trim() || !email.trim()}
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Enviando...</span>
        ) : (
          <><Send className="w-4 h-4" /> Enviar solicitud</>
        )}
      </Button>
    </div>
  );
}

function TrialSentView({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-6 space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto"
      >
        ✅
      </motion.div>
      <div>
        <h2 className="font-extrabold text-xl mb-2">¡Solicitud enviada!</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Tu solicitud de 7 días gratis fue recibida por el equipo BLANG. Te contactaremos en máximo <strong>48 horas hábiles</strong> para activar tu acceso.
        </p>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-left">
        <p className="text-xs text-amber-700">
          ⚠️ <strong>Importante:</strong> Tu cuenta aún no está activa. Espera la confirmación del equipo BLANG antes de intentar acceder a los cursos.
        </p>
      </div>
      <Button className="w-full rounded-2xl py-4 font-bold" onClick={onClose}>
        Entendido, esperaré la confirmación
      </Button>
    </div>
  );
}

function PaymentFormView({
  title, subtitle, badge, amount,
  name, email, payMethod, loading, copied, setCopied, emailError,
  onNameChange, onEmailChange, onMethodChange, onSubmit,
}: {
  title: string;
  subtitle: string;
  badge: string;
  amount: number;
  name: string;
  email: string;
  payMethod: PayMethod;
  loading: boolean;
  copied: boolean;
  setCopied: (v: boolean) => void;
  emailError?: string | null;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onMethodChange: (v: PayMethod) => void;
  onSubmit: () => void;
}) {
  const adminEmail = 'blangenglishlearning@blangenglish.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="text-center mb-3">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary mb-2">{badge}</span>
        <h2 className="font-extrabold text-xl mb-1">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Nombre completo</Label>
          <Input value={name} onChange={e => onNameChange(e.target.value)} placeholder="Tu nombre" className="rounded-xl" />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Correo electrónico</Label>
          <Input type="email" value={email} onChange={e => onEmailChange(e.target.value)} placeholder="tu@correo.com" className="rounded-xl" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onMethodChange('paypal')}
            className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all flex items-center justify-center gap-1 ${
              payMethod === 'paypal'
                ? 'border-[#003087] bg-[#003087]/5 text-[#003087]'
                : 'border-border/40 text-muted-foreground'
            }`}
          >
            <PayPalIcon /> PayPal
          </button>
          <button
            onClick={() => onMethodChange('pse')}
            className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all ${
              payMethod === 'pse'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-border/40 text-muted-foreground'
            }`}
          >
            🏦 PSE / Transferencia
          </button>
        </div>
      </div>

      {payMethod === 'paypal' && (
        <div className="rounded-xl border-2 border-[#FFC439]/60 bg-[#FFC439]/5 p-4 space-y-2">
          <p className="text-xs font-bold text-[#003087]">Instrucciones — PayPal</p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Accede a tu cuenta de PayPal</li>
            <li>Envía <strong>${amount.toFixed(2)} USD</strong> a la cuenta BLANG</li>
            <li>En el concepto escribe tu nombre y correo</li>
            <li>Envía el comprobante al administrador</li>
          </ol>
          <a
            href="https://paypal.me/blangenglish"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
          >
            <ExternalLink className="w-3 h-3" /> Ir a PayPal para pagar →
          </a>
        </div>
      )}

      {payMethod === 'pse' && (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-bold text-emerald-800">PSE / Transferencia bancaria (Colombia)</p>
          <p className="text-xs text-muted-foreground">Envía el comprobante de pago a:</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
            <span className="text-xs font-mono flex-1 truncate">{adminEmail}</span>
            <button onClick={copyEmail} className="text-primary shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-amber-700">⚠️ Los datos bancarios se enviarán a tu correo tras confirmar la solicitud.</p>
        </div>
      )}

      {emailError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3">
          <p className="text-xs text-red-700">{emailError}</p>
          <p className="text-xs text-red-600 mt-1">Si el problema persiste, escríbenos a <strong>blangenglishlearning@blangenglish.com</strong></p>
        </div>
      )}

      <Button
        className="w-full rounded-2xl py-5 font-bold text-base gap-2"
        onClick={onSubmit}
        disabled={loading || !name.trim() || !email.trim()}
      >
        {loading ? (
          <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Enviando...</span>
        ) : (
          <><Send className="w-4 h-4" /> Confirmar solicitud de pago</>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        El administrador revisará tu solicitud y activará tu cuenta en máximo 48 horas hábiles.
      </p>
    </div>
  );
}

function PaymentSentView({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-6 space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto"
      >
        ✅
      </motion.div>
      <div>
        <h2 className="font-extrabold text-xl mb-2">¡Solicitud de pago enviada!</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Recibimos tu solicitud. El equipo BLANG revisará tu comprobante de pago y activará tu cuenta en máximo <strong>48 horas hábiles</strong>.
        </p>
      </div>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-left">
        <p className="text-xs text-blue-700">
          ℹ️ <strong>Próximos pasos:</strong> Recibirás un correo de confirmación cuando tu cuenta esté activa. Si tienes dudas, escríbenos a <strong>blangenglishlearning@blangenglish.com</strong>
        </p>
      </div>
      <Button className="w-full rounded-2xl py-4 font-bold" onClick={onClose}>
        Entendido, esperaré la confirmación
      </Button>
    </div>
  );
}

export default OnboardingFlow;
