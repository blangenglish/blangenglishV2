import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePricingPlans } from '@/hooks/useSupabaseData';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { UnitViewer } from '@/components/UnitViewer';
import { RenewalAlert } from '@/components/RenewalAlert';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { LevelExam } from '@/components/LevelExam';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  User, CreditCard, HelpCircle, LogOut,
  ChevronRight, BookOpen, Lock, Eye, EyeOff, Check,
  AlertCircle, Flame, Star, Award, ChevronDown, ChevronUp,
  FlaskConical, Calendar, GraduationCap, MapPin, Phone,
  Video, Plus, Trash2, Clock, Mail, History, CheckCircle2,
  ExternalLink, Copy, MessageSquare,
} from 'lucide-react';

interface DashboardProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

type TabId = 'cursos' | 'cuenta' | 'pagos' | 'progreso' | 'sesion' | 'ayuda';

const LEVEL_COLORS: Record<string, { color: string; badge: string }> = {
  A1: { color: 'from-green-400/20 to-emerald-400/20 border-green-200', badge: 'bg-green-100 text-green-700' },
  A2: { color: 'from-teal-400/20 to-cyan-400/20 border-teal-200', badge: 'bg-teal-100 text-teal-700' },
  B1: { color: 'from-blue-400/20 to-indigo-400/20 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  B2: { color: 'from-purple-400/20 to-violet-400/20 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  C1: { color: 'from-amber-400/20 to-yellow-400/20 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

const FAQ_QUICK = [
  { q: '¿Cómo cancelo mi suscripción?', a: 'Ve a la pestaña "Pagos" en tu perfil y selecciona "Cancelar suscripción". Tu acceso continuará hasta el final del período pagado.' },
  { q: '¿Puedo cambiar mi correo?', a: 'Por seguridad el correo no se puede cambiar directamente. Escríbenos a blangenglishlearning@blangenglish.com con tu solicitud.' },
  { q: '¿Cómo reservo una sesión en vivo?', a: 'Desde la sección "Sesiones en Vivo" en el inicio podrás reservar. Recuerda que el costo es de $10 USD por hora.' },
  { q: '¿Cómo funciona la práctica con IA?', a: 'Al final de cada unidad encontrarás el paso 5 de práctica con IA, donde podrás conversar y escribir con inteligencia artificial para reforzar lo aprendido.' },
  { q: '¿Qué pasa si tengo un problema técnico?', a: 'Escríbenos usando el formulario de la sección de Preguntas Frecuentes o por nuestros canales de WhatsApp e Instagram.' },
];

interface DBCourseRow { id: string; emoji: string; title: string; level: string; total_units: number; is_published: boolean; sort_order: number; description: string; required_level?: string; }
interface DBUnitRow { id: string; course_id: string; title: string; description: string; sort_order: number; is_published: boolean; }

// ── PayPal Hosted Button (oficial SDK) ──
const PAYPAL_CLIENT_ID = 'BAA2srggiH3C_NZOPi5WgvxY9uAmQ5IdL4jsKRt4OdZ_xB6nE1vAWM6800tAFqwddu-eYQBLEEEuXhDNJg';
const PAYPAL_BUTTON_ID  = 'LSDLRPXB2WLJL';

function PayPalHostedButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    // Unique container id to avoid collisions
    const containerId = `paypal-container-${PAYPAL_BUTTON_ID}`;
    if (containerRef.current) containerRef.current.id = containerId;

    // If SDK already loaded, render immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).paypal?.HostedButtons) {
      renderButton(containerId);
      return;
    }

    // Remove any previous duplicate script
    const existing = document.getElementById('paypal-sdk-script');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id  = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.async = true;
    script.onload = () => renderButton(containerId);
    script.onerror = () => setError(true);
    document.body.appendChild(script);

    return () => {
      // Clean up rendered button on unmount
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderButton(containerId: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).paypal.HostedButtons({ hostedButtonId: PAYPAL_BUTTON_ID }).render(`#${containerId}`);
      setLoaded(true);
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <a
        href="https://www.paypal.com/paypalme/blangenglish"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#002070] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors w-full"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
        Pagar con PayPal
      </a>
    );
  }

  return (
    <div className="w-full">
      {!loaded && (
        <div className="flex items-center justify-center gap-2 bg-[#FFC439]/10 border border-[#FFC439]/40 rounded-xl py-4 text-sm text-[#003087] font-medium">
          <div className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
          Cargando PayPal...
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

// ── PlanSelector: 2 opciones (nuevo) o solo pago (reactivar) ──
function PlanSelector({ currentUserId, currentEmail, onPlanSaved, onOpenPaypal, mode = 'new' }: {
  currentUserId: string;
  currentEmail: string;
  onPlanSaved: () => void;
  onOpenPaypal: () => void;
  mode?: 'new' | 'reactivate';
}) {
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'full' | null>(null);
  const trialDays = 7;
  const [payMethod, setPayMethod] = useState<'pse' | 'paypal'>('pse');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'select' | 'pay'>('select');

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('save-onboarding-2026', {
      body: { action: 'save_subscription', student_id: currentUserId, plan: selectedPlan, method: payMethod },
    });
    if (error) {
      // Fallback directo
      const today = new Date();
      const trialEnd = new Date(today); trialEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
      const isPaid = selectedPlan === 'full';
      const subData = {
        student_id: currentUserId,
        plan_slug: isPaid ? 'monthly' : 'free_trial',
        plan_name: isPaid ? 'Plan Mensual' : '7 días gratis',
        status: isPaid ? 'pending_approval' : 'trial',
        amount_usd: isPaid ? 15 : 0,
        payment_method: payMethod,
        approved_by_admin: !isPaid,
        account_enabled: !isPaid,
        current_period_end: isPaid ? monthEnd.toISOString() : trialEnd.toISOString(),
        trial_ends_at: !isPaid ? trialEnd.toISOString() : null,
      };
      const { error: e1 } = await supabase.from('subscriptions').insert(subData);
      if (e1) await supabase.from('subscriptions').update(subData).eq('student_id', currentUserId);
    }
    setSaving(false);
    onPlanSaved();
  };

  if (step === 'pay' && selectedPlan === 'full') {
    const amountUsd = 15;
    const planLabel = 'Plan Mensual';
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-primary/20 p-5 bg-background">
          <button onClick={() => setStep('select')} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
            ← Volver
          </button>
          <h3 className="font-extrabold text-lg mb-1">Elige cómo pagar</h3>
          <p className="text-sm text-muted-foreground mb-5">{planLabel} — <strong>${amountUsd} USD</strong></p>

          {/* PayPal → guarda y abre modal */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 mb-3 border-[#003087]/30 bg-[#003087]/5 hover:border-[#003087]/60 transition-all"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const { error } = await supabase.functions.invoke('save-onboarding-2026', {
                body: { action: 'save_subscription', student_id: currentUserId, plan: selectedPlan, method: 'paypal' },
              });
              if (error) {
                const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
                const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: planLabel, status: 'pending_approval', amount_usd: amountUsd, payment_method: 'paypal', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
                const { error: e1 } = await supabase.from('subscriptions').insert(d);
                if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
              }
              setSaving(false);
              onPlanSaved();
              onOpenPaypal();
            }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#003087] shrink-0"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
            <div className="text-left">
              <p className="font-bold text-[#003087] text-sm">{saving ? 'Preparando...' : 'Pagar con PayPal 💳'}</p>
              <p className="text-xs text-muted-foreground">Activación automática al confirmar pago</p>
            </div>
          </button>

          {/* PSE — próximamente */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-border/40 bg-muted/20 opacity-60 cursor-not-allowed"
            disabled
          >
            <span className="text-2xl">🏦</span>
            <div className="text-left">
              <p className="font-bold text-sm">PSE — Próximamente</p>
              <p className="text-xs text-muted-foreground">Disponible muy pronto</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Modo reactivar: solo PayPal + PSE, precio normal ──
  if (mode === 'reactivate') {
    return (
      <div className="rounded-2xl border-2 border-primary/20 p-5 bg-background space-y-4">
        <div>
          <h3 className="font-extrabold text-xl mb-1">Reactivar suscripción 🔄</h3>
          <p className="text-sm text-muted-foreground">Plan Mensual — <strong>$15 USD/mes</strong></p>
        </div>

        {/* PayPal */}
        <button
          className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-[#003087]/30 bg-[#003087]/5 hover:border-[#003087]/60 transition-all"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
            const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: 'Plan Mensual', status: 'pending_approval', amount_usd: 15, payment_method: 'paypal', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
            const { error: e1 } = await supabase.from('subscriptions').insert(d);
            if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
            setSaving(false);
            onPlanSaved();
            onOpenPaypal();
          }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#003087] shrink-0"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
          <div className="text-left">
            <p className="font-bold text-[#003087] text-sm">{saving ? 'Preparando...' : 'Pagar con PayPal'}</p>
            <p className="text-xs text-muted-foreground">Se abrirá el formulario de pago</p>
          </div>
        </button>

        {/* PSE — próximamente */}
        <button disabled className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-border/40 bg-muted/20 opacity-50 cursor-not-allowed">
          <span className="text-2xl">🏦</span>
          <div className="text-left">
            <p className="font-bold text-sm">PSE — Próximamente</p>
            <p className="text-xs text-muted-foreground">Disponible muy pronto</p>
          </div>
        </button>
      </div>
    );
  }

  // ── Modo nuevo usuario: 2 opciones ──
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border/50 p-5 bg-background">
        <h3 className="font-extrabold text-xl mb-1">Elige tu plan 🎓</h3>
        <p className="text-sm text-muted-foreground mb-5">Selecciona una opción para habilitar tus cursos.</p>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Opción 1: Prueba gratis */}
          <button
            onClick={() => setSelectedPlan('trial')}
            className={`rounded-2xl border-2 p-5 text-left flex flex-col gap-3 transition-all ${
              selectedPlan === 'trial'
                ? 'border-blue-400 bg-blue-50/50 shadow-md'
                : 'border-border/50 hover:border-blue-300 hover:bg-blue-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">🌱</span>
              {selectedPlan === 'trial' && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">✓</span>}
            </div>
            <div>
              <p className="font-extrabold text-base">Prueba Gratis</p>
              <p className="text-xs text-muted-foreground mb-1">{trialDays ?? 7} días</p>
              <p className="text-2xl font-black text-blue-600">$0</p>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Cancela cuando quieras</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Acceso módulo A1</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Después $15 USD / $55,000 COP/mes</li>
            </ul>
          </button>

          {/* Opción 2: Plan completo */}
          <button
            onClick={() => setSelectedPlan('full')}
            className={`rounded-2xl border-2 p-5 text-left flex flex-col gap-3 transition-all relative ${
              selectedPlan === 'full'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">⭐ Recomendado</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🚀</span>
              {selectedPlan === 'full' && <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">✓</span>}
            </div>
            <div>
              <p className="font-extrabold text-base">Plan Mensual</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-primary">$15 USD</p>
              </div>
              <p className="text-xs text-muted-foreground">o $55,000 COP / mes</p>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> Acceso completo a TODOS los cursos</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> A1, A2, B1, B2, C1</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> PSE o PayPal</li>
            </ul>
          </button>
        </div>

        {selectedPlan && (
          <div className="mt-5">
            {selectedPlan === 'trial' ? (
              <Button className="w-full rounded-xl py-3 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleConfirmPlan} disabled={saving}>
                {saving ? 'Activando...' : '🌱 Activar prueba gratis →'}
              </Button>
            ) : (
              <Button className="w-full rounded-xl py-3 font-bold"
                onClick={() => setStep('pay')}>
                Continuar con Plan Mensual → $15 USD
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TrialPaymentActiveBlock: pantalla de pagos DURANTE el período de prueba ──
// SOLO muestra: mensaje bienvenida + fecha vencimiento + 2 botones exactos
// ⚠️ NUNCA muestra planes adicionales, precios ni más opciones aquí
function TrialPaymentActiveBlock({
  fmt, trialEnd, regDate, onCancelTrial, onWantPay
}: {
  fmt: (d: Date | null) => string;
  trialEnd: Date;
  regDate: Date;
  payConfig: Record<string, string>;
  onCancelTrial: () => void;
  onWantPay: () => void;
}) {
  return (
    <div className="space-y-4">

      {/* ── Mensaje de bienvenida con fecha dinámica ── */}
      <div className="rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50/60 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shrink-0">🌱</div>
          <div className="flex-1">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-green-100 text-green-700 border border-green-200">
              ✅ Prueba activa
            </span>
            <h2 className="font-extrabold text-lg leading-snug mb-2">
              Bienvenido/a a este plan de 7 días gratis, tienes hasta el{' '}
              <span className="text-green-700 underline decoration-dotted">{fmt(trialEnd)}</span>.
            </h2>
            <p className="text-xs text-muted-foreground">Acceso al nivel A1 · Primeros 5 módulos desbloqueados</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
            <p className="text-xs text-muted-foreground mb-0.5">📅 Activación</p>
            <p className="font-bold text-sm">{fmt(regDate)}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
            <p className="text-xs text-muted-foreground mb-0.5">⏰ Vencimiento</p>
            <p className="font-bold text-sm text-green-700">{fmt(trialEnd)}</p>
          </div>
        </div>
      </div>

      {/* ── SOLO estos 2 botones — regla estricta, no agregar más ── */}
      <div className="rounded-2xl border-2 border-border/50 bg-background p-5 space-y-3">
        {/* Botón 1: pagar plan mensual */}
        <Button
          className="w-full rounded-xl py-5 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onWantPay}
        >
          💳 Terminar 7 días gratis, pagar plan mensual
        </Button>
        {/* Botón 2: cancelar suscripción */}
        <Button
          variant="outline"
          className="w-full rounded-xl py-5 font-medium text-sm text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={onCancelTrial}
        >
          🚪 Cancelar suscripción
        </Button>
      </div>

    </div>
  );
}

// ── TrialPaymentBlock: selector de planes con métodos de pago ──
// SOLO se muestra cuando: prueba_finalizada | deshabilitado
// NUNCA se muestra a: estudiantes nuevos | prueba_activa | pendiente_pago
function TrialPaymentBlock({
  fmtDate, trialEnd, onSelectPlan, payConfig, mode
}: {
  fmtDate: (d: Date | null) => string;
  trialEnd: Date;
  onSelectPlan: (amount: number, planLabel: string) => void;
  payConfig: Record<string, string>;
  mode?: 'trial' | 'reactivate' | 'pending' | 'trial_expired' | 'primer_registro';
}) {
  const [activeMethod, setActiveMethod] = useState<'paypal'|'pse'>('paypal');
  const [selectedPlan, setSelectedPlan] = useState<'full'>('full');
  const [copied, setCopied] = useState(false);
  const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';
  const pseBankName = payConfig['pse_bank_name'] || '';
  const pseAccountType = payConfig['pse_account_type'] || 'Ahorros';
  const pseAccountNumber = payConfig['pse_account_number'] || '';
  const pseOwnerName = payConfig['pse_owner_name'] || '';
  const paypalLink = payConfig['paypal_link'] || 'https://paypal.me/blangenglish';
  const amount = 15;

  const copyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Aviso según modo */}
      {/* modo 'trial': solo si se pasa explícitamente (no se usa actualmente) */}
      {mode === 'trial' && (
        <div className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🌱</span>
            <p className="font-bold text-blue-900">Prueba gratis activa — acceso módulo A1</p>
          </div>
          <p className="text-sm text-blue-800">
            Tu prueba termina el <strong>{fmtDate(trialEnd)}</strong>. Al vencer, tu cuenta quedará <strong>deshabilitada automáticamente</strong>. Para continuar con todos los cursos (A2–C1) elige un plan abajo.
          </p>
        </div>
      )}
      {mode === 'reactivate' && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔒</span>
            <p className="font-bold text-red-900">Tu cuenta está deshabilitada</p>
          </div>
          <p className="text-sm text-red-800">
            Elige un plan, realiza el pago y envía el comprobante al administrador para reactivar tu cuenta.
          </p>
        </div>
      )}
      {mode === 'trial_expired' && (
        <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⌛</span>
            <p className="font-bold text-orange-900">Tu período de prueba ha terminado</p>
          </div>
          <p className="text-sm text-orange-800">
            Tu prueba gratuita venció el <strong>{fmtDate(trialEnd)}</strong>. Para continuar con todos los cursos (A2–C1), elige un plan:
          </p>
        </div>
      )}
      {mode === 'primer_registro' && (
        <div className="rounded-2xl bg-primary/5 border-2 border-primary/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <p className="font-bold text-foreground">Elige tu plan para comenzar</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona el plan que más te convenga, realiza el pago y envía el comprobante. Tu cuenta se activará en máximo 48 horas hábiles.
          </p>
        </div>
      )}
      {mode === 'pending' && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏳</span>
            <p className="font-bold text-amber-900">Completa tu pago para activar la cuenta</p>
          </div>
          <p className="text-sm text-amber-800">
            Tu solicitud fue registrada. Elige el plan que deseas pagar y envía el comprobante al administrador.
          </p>
        </div>
      )}

      {/* Plan único */}
      <div className="rounded-2xl p-4 text-left border-2 border-primary bg-primary/5 shadow-md">
        <p className="font-extrabold text-sm">Plan Mensual</p>
        <p className="text-xl font-black text-primary">$15 <span className="text-xs font-normal text-muted-foreground">USD / mes</span></p>
        <p className="text-sm text-muted-foreground">o $55,000 COP al mes</p>
      </div>

      {/* Selector de método de pago */}
      <div className="rounded-2xl border-2 border-border/50 overflow-hidden">
        <div className="bg-muted/30 px-5 py-3 flex items-center gap-2 border-b border-border/40">
          <CreditCard className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Método de pago — <span className="text-primary">${amount} USD</span></span>
        </div>
        <div className="p-4 space-y-4">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveMethod('paypal')}
              className={`rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${
                activeMethod === 'paypal' ? 'border-[#003087] bg-[#003087]/5 text-[#003087]' : 'border-border/40 text-muted-foreground hover:border-[#003087]/30'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 inline mr-1.5 fill-current"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
              PayPal
            </button>
            <button
              onClick={() => setActiveMethod('pse')}
              className={`rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${
                activeMethod === 'pse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border/40 text-muted-foreground hover:border-emerald-400'
              }`}
            >
              🏦 PSE / Transferencia
            </button>
          </div>

          {/* PayPal instructions */}
          {activeMethod === 'paypal' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-800">Instrucciones de pago — PayPal</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Accede a tu cuenta de PayPal</li>
                <li>Envía <strong>${amount} USD</strong> a la cuenta BLANG</li>
                <li>En el concepto escribe: <strong>tu nombre + correo de registro</strong></li>
                <li>Envía el comprobante al correo del administrador</li>
              </ol>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-100">
                <span className="text-xs font-mono text-foreground flex-1 truncate">{ADMIN_EMAIL}</span>
                <button onClick={copyEmail} className="text-primary shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a href={paypalLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                <ExternalLink className="w-3 h-3" /> Ir a PayPal para pagar →
              </a>
              <Button
                className="w-full rounded-xl bg-[#003087] hover:bg-[#002070] text-white font-bold gap-2"
                onClick={() => onSelectPlan(amount, 'Plan Mensual')}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
                Ya realicé el pago de ${amount} USD con PayPal
              </Button>
              <p className="text-xs text-amber-700">⏱ Tu cuenta se activará en máximo 48h hábiles al confirmar el pago.</p>
            </div>
          )}

          {/* PSE instructions */}
          {activeMethod === 'pse' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-800">Instrucciones de pago — PSE / Transferencia bancaria</p>
              <p className="text-xs text-emerald-700">Solo disponible para Colombia · Activación en máximo 48 horas hábiles.</p>
              <div className="bg-white rounded-lg p-3 border border-emerald-100 space-y-1.5">
                {pseBankName ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Banco:</span>
                    <span className="font-semibold">{pseBankName}</span>
                    <span className="text-muted-foreground">Tipo de cuenta:</span>
                    <span className="font-semibold">{pseAccountType}</span>
                    {pseAccountNumber && (<><span className="text-muted-foreground">N° de cuenta:</span><span className="font-bold font-mono">{pseAccountNumber}</span></>)}
                    {pseOwnerName && (<><span className="text-muted-foreground">Titular:</span><span className="font-semibold">{pseOwnerName}</span></>)}
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-extrabold text-emerald-700">${amount} USD</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">📌 Los datos bancarios serán enviados a tu correo al confirmar la solicitud.</p>
                )}
              </div>
              <p className="text-xs font-bold text-foreground">Envía el comprobante a:</p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                <span className="text-xs font-mono flex-1 truncate">{ADMIN_EMAIL}</span>
                <button onClick={copyEmail} className="text-primary shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Button
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                onClick={() => onSelectPlan(amount, 'Plan Mensual')}
              >
                🏦 Ya realicé la transferencia de ${amount} USD
              </Button>
              <p className="text-xs text-amber-700">⚠️ El pago es <strong>manual</strong>. Envía el soporte al menos <strong>1 día antes</strong> del vencimiento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UpdateRequestForm: solicitud de cambio de datos al admin ──
function UpdateRequestForm({ studentName, studentEmail }: { studentName: string; studentEmail: string }) {
  const FIELDS = [
    { value: 'full_name', label: 'Nombre completo' },
    { value: 'phone', label: 'Teléfono / WhatsApp' },
    { value: 'country', label: 'País' },
    { value: 'city', label: 'Ciudad' },
    { value: 'birthday', label: 'Fecha de nacimiento' },
    { value: 'education_level', label: 'Nivel de educación' },
    { value: 'other', label: 'Otro' },
  ];
  const [field, setField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!field || !newValue.trim()) { setFormError('Por favor selecciona el dato y escribe el nuevo valor.'); return; }
    setFormError('');
    setSending(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-profile-update-request-2026', {
        body: { studentName, studentEmail, field, newValue: newValue.trim(), message: message.trim() },
      });
      if (fnErr) throw fnErr;
      if (data?.success === false && !data?.skipped) throw new Error('No se pudo enviar');
      setSent(true);
    } catch (_) {
      setFormError('Hubo un problema al enviar tu solicitud. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-bold text-base">¡Solicitud enviada! 📬</p>
          <p className="text-sm text-muted-foreground max-w-xs">Tu solicitud fue recibida. El administrador actualizará tu información pronto.</p>
          <button onClick={() => { setSent(false); setField(''); setNewValue(''); setMessage(''); }} className="text-sm text-primary underline mt-1">Enviar otra solicitud</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
      <h2 className="font-bold text-base mb-1 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" /> Solicitar cambio de datos
      </h2>
      <p className="text-sm text-muted-foreground mb-5">¿Necesitas actualizar algún dato de tu perfil? Envíanos una solicitud y lo haremos por ti.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">¿Qué dato quieres actualizar?</Label>
          <select
            value={field}
            onChange={e => setField(e.target.value)}
            className="w-full border border-border/60 bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          >
            <option value="">Selecciona un campo...</option>
            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Nuevo valor</Label>
          <Input
            placeholder={field === 'birthday' ? 'Ej: 11/03/2001' : field === 'phone' ? '+57 300 000 0000' : 'Escribe el nuevo valor...'}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Mensaje adicional <span className="text-xs">(opcional)</span></Label>
          <textarea
            placeholder="Si necesitas aclarar algo más..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            className="w-full border border-border/60 bg-background rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={sending} className="rounded-xl bg-primary text-primary-foreground px-6 h-9 text-sm">
          {sending ? 'Enviando...' : '📤 Enviar solicitud'}
        </Button>
      </form>
    </div>
  );
}

export default function Dashboard({ isLoggedIn = false, onOpenAuth, onLogout, userName }: DashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('cursos');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', country: '', city: '', birthday: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  // unit progress map: unitId → number of completed stages
  const [unitProgressMap, setUnitProgressMap] = useState<Record<string, number>>({});

  // Session booking form state
  interface SessionSlot { date: string; topic: string; }
  const [sessionName, setSessionName] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionSlots, setSessionSlots] = useState<SessionSlot[]>([{ date: '', topic: '' }]);
  const [sessionWeekly, setSessionWeekly] = useState(false);
  const [sessionWeeklyHours, setSessionWeeklyHours] = useState('');
  const [sessionWeeklySchedule, setSessionWeeklySchedule] = useState('');
  const [sessionObjective, setSessionObjective] = useState('');
  const [sessionSent, setSessionSent] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', message: '' });
  const [teacherSent, setTeacherSent] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalModalAmount, setPaypalModalAmount] = useState(15);
  const [payConfig, setPayConfig] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<{ plan_name: string; plan_slug?: string; status: string; amount_usd: number; current_period_end: string; payment_method?: string; renewal_due_at?: string; approved_by_admin?: boolean; account_enabled?: boolean; created_at?: string; trial_ends_at?: string; trial_active?: boolean } | null>(null);
  // Payment history
  interface PaymentHistoryRow { id: string; event_type: string; amount_usd: number; payment_method: string; notes?: string; created_at: string; created_by?: string; }
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  // Progress from DB
  const [totalUnitsCompleted, setTotalUnitsCompleted] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [realCompletedUnits, setRealCompletedUnits] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const [studentProfile, setStudentProfile] = useState<{
    english_level?: string;
    onboarding_step?: string;
    is_admin_only?: boolean;
    birthday?: string;
    country?: string;
    city?: string;
    education_level?: string;
    education_other?: string;
    account_enabled?: boolean;
    account_status?: string;  // 'pending' | 'active_trial' | 'active' | 'disabled' | 'cancelled' | 'pending_payment' | 'expired_trial'
    trial_active?: boolean;
    trial_start_date?: string;
    trial_end_date?: string;
    created_at?: string;
  } | null>(null);
  // IDs de cursos/unidades con acceso explícito habilitado por admin
  const [grantedModuleIds, setGrantedModuleIds] = useState<string[]>([]);
  // IDs de cursos/unidades con acceso explícitamente revocado por admin
  const [revokedModuleIds, setRevokedModuleIds] = useState<string[]>([]);
  const [showRenewalAlert, setShowRenewalAlert] = useState(false);
  const [showLevelOnboarding, setShowLevelOnboarding] = useState(false);
  const [showLevelExam, setShowLevelExam] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<string>('welcome');
  const [currentUserId, setCurrentUserId] = useState('');

  // Real courses & units from Supabase
  const [dbCourses, setDbCourses] = useState<DBCourseRow[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseUnits, setCourseUnits] = useState<Record<string, DBUnitRow[]>>({});
const [loadingUnits, setLoadingUnits] = useState<string | null>(null);
  const [viewerUnit, setViewerUnit] = useState<{ id: string; title: string; description: string } | null>(null);
  // Modal payment tab state (used in showPaypalModal)
  const [modalTab, setModalTab] = useState<'paypal'|'pse'>('paypal');
  const [modalCopied, setModalCopied] = useState(false);

useEffect(() => {
    // Load payment config
    supabase.from('payment_config').select('key, value').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: { key: string; value: string | null }) => { map[r.key] = r.value || ''; });
        setPayConfig(map);
      }
    });
  }, []);

  useEffect(() => {
    // Load published courses from DB
    supabase.from('courses').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      if (data) setDbCourses(data as DBCourseRow[]);
      setCoursesLoading(false);
    });
  }, []);

  const loadUnitsForCourse = async (courseId: string) => {
    if (courseUnits[courseId]) return; // already loaded
    setLoadingUnits(courseId);
    const { data } = await supabase.from('units').select('*').eq('course_id', courseId).eq('is_published', true).order('sort_order');
    const units = (data || []) as DBUnitRow[];
    setCourseUnits(prev => ({ ...prev, [courseId]: units }));
    setLoadingUnits(null);
    // Cargar progreso de cada unidad
    if (units.length > 0 && currentUserId) {
      const unitIds = units.map(u => u.id);
      const { data: progData } = await supabase.from('unit_progress')
        .select('unit_id')
        .in('unit_id', unitIds)
        .eq('student_id', currentUserId)
        .eq('completed', true);
      const newMap: Record<string, number> = {};
      (progData || []).forEach((p: { unit_id: string }) => {
        newMap[p.unit_id] = (newMap[p.unit_id] || 0) + 1;
      });
      setUnitProgressMap(prev => ({ ...prev, ...newMap }));
    }
  };

  const toggleCourse = (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    loadUnitsForCourse(courseId);
  };

  // ── refreshProfile: carga perfil + suscripción + historial usando cliente directo ──
  const refreshProfile = async (userId: string) => {
    setProfileLoading(true);
    const [profRes, subRes, histRes, modRes] = await Promise.all([
      supabase
        .from('student_profiles')
        .select('full_name, phone, english_level, onboarding_step, is_admin_only, birthday, country, city, education_level, education_other, account_enabled, account_status, trial_active, trial_start_date, trial_end_date, created_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('payment_history')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('student_module_access')
        .select('course_id, unit_id, is_active')
        .eq('student_id', userId),
    ]);

    const prof = profRes.data;
    const sub  = subRes.data;
    const hist = histRes.data;
    const mods = modRes.data;

    // Debug: log errores de BD para detectar problemas de RLS o columnas faltantes
    if (profRes.error) console.error('[refreshProfile] student_profiles error:', profRes.error);
    if (subRes.error)  console.error('[refreshProfile] subscriptions error:', subRes.error);
    if (histRes.error) console.error('[refreshProfile] payment_history error:', histRes.error);

    if (prof) {
      // Perfil cargado desde BD -- siempre prioridad al nombre en BD
      const dbName = (prof as { full_name?: string }).full_name || '';
      const displayFullName = dbName || userName || '';
      setProfileForm({
        name: displayFullName,
        phone: (prof as { phone?: string }).phone || '',
        country: (prof as { country?: string }).country || '',
        city: (prof as { city?: string }).city || '',
        birthday: (prof as { birthday?: string }).birthday || '',
      });
      setStudentProfile(prof as typeof studentProfile);
      setTeacherForm((tf: typeof teacherForm) => ({ ...tf, name: displayFullName }));
      setSessionName(displayFullName);
    } else if (!profRes.error) {
      // prof es null pero sin error -- perfil no existe, crearlo
      const newName = userName || '';
      await supabase.from('student_profiles').upsert({
        id: userId,
        full_name: newName || null,
        onboarding_step: 'pending_plan',
        account_status: 'pending',
      });
      setProfileForm(p => ({ ...p, name: newName }));
      setSessionName(newName);
      setTeacherForm(tf => ({ ...tf, name: newName }));
    } else {
      // Error de BD -- usar nombre del auth
      setProfileForm(p => ({ ...p, name: p.name || userName || '' }));
    }

    if (hist) setPaymentHistory(hist as PaymentHistoryRow[]);

    setSubscription(sub ? (sub as typeof subscription) : null);
    if (sub) {
      const method = (sub as { payment_method?: string }).payment_method;
      const dueAt  = (sub as { renewal_due_at?: string }).renewal_due_at;
      if ((method === 'pse' || method === 'paypal') && dueAt) {
        const ms = new Date(dueAt).getTime() - Date.now();
        if (ms > 0 && ms <= 24 * 60 * 60 * 1000) setShowRenewalAlert(true);
      }
    }

    const allMods = ((mods ?? []) as { course_id?: string; unit_id?: string; is_active?: boolean }[]);
    // granted: solo is_active === true EXPLÍCITAMENTE (admin concedió acceso)
    const grantedIds = allMods
      .filter(m => m.is_active === true)
      .map(m => m.unit_id || m.course_id || '')
      .filter(Boolean);
    // revoked: is_active === false EXPLÍCITAMENTE (admin revocó acceso)
    const revokedIds = allMods
      .filter(m => m.is_active === false)
      .map(m => m.unit_id || m.course_id || '')
      .filter(Boolean);
    setGrantedModuleIds(grantedIds);
    setRevokedModuleIds(revokedIds);
    setProfileLoading(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    // Cargar sesión y perfil al montar — usando getSession para tener el token listo
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (!user) return;
      setCurrentEmail(user.email || '');
      setCurrentUserId(user.id);
      setSessionEmail(user.email || '');
      refreshProfile(user.id);
      // Load real progress from unit_progress
      supabase.from('unit_progress')
        .select('unit_id, completed, completed_at')
        .eq('student_id', user.id)
        .eq('completed', true)
        .then(({ data }) => {
          if (data) {
            // Count unique completed units
            const uniqueUnits = new Set(data.map((p: { unit_id: string }) => p.unit_id));
            setRealCompletedUnits(uniqueUnits.size);
            setTotalUnitsCompleted(uniqueUnits.size);
            // Calc streak from completed_at dates
            const dates = data
              .map((p: { completed_at: string | null }) => p.completed_at)
              .filter(Boolean) as string[];
            const uniqueDays = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (uniqueDays.length === 0 || (uniqueDays[0] !== today && uniqueDays[0] !== yesterday)) {
              setStreakDays(0);
            } else {
              let streak = 1;
              for (let i = 1; i < uniqueDays.length; i++) {
                const prev = new Date(uniqueDays[i - 1]);
                const curr = new Date(uniqueDays[i]);
                const diff = (prev.getTime() - curr.getTime()) / 86400000;
                if (Math.round(diff) === 1) streak++;
                else break;
              }
              setStreakDays(streak);
            }
          }
        });
    });
  }, [isLoggedIn, userName]);

  // Realtime + polling para detectar cambios del admin (onboarding_step, plan, acceso módulos)
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;

    const doRefresh = () => refreshProfile(currentUserId);

    // Canal único: escucha student_profiles + subscriptions + student_module_access
    const channel = supabase
      .channel(`admin-changes-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles',      filter: `id=eq.${currentUserId}` },       doRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions',         filter: `student_id=eq.${currentUserId}` }, doRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_module_access', filter: `student_id=eq.${currentUserId}` }, doRefresh)
      .subscribe();

    // Polling de respaldo cada 8s para asegurar que cambios admin se reflejen
    const interval = setInterval(doRefresh, 8000);
    const onFocus = () => doRefresh();
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, currentUserId]);

  // Level-based course visibility
  const studentLevel = studentProfile?.english_level;
  const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const studentLevelIdx = studentLevel ? LEVEL_ORDER.indexOf(studentLevel) : -1;

  // Estados de suscripción
  const subStatus      = subscription?.status;
  const subEnabled     = subscription?.account_enabled;
  const subApproved    = subscription?.approved_by_admin;
  const subPlan        = subscription?.plan_slug;
  const isTrial7       = (subPlan === 'free_trial' || subStatus === 'trial') && subStatus !== 'cancelled';
  const isPendingPayment = subApproved === false && subEnabled === false && subStatus !== 'cancelled';

  // ── Fuente de verdad del perfil (tiene prioridad sobre subscription) ──
  const profStatus     = studentProfile?.account_status;
  const profEnabled    = studentProfile?.account_enabled;
  // Cuenta activa según el perfil (admin habilitó directamente en student_profiles)
  const isProfileActive = profStatus === 'active' && profEnabled === true;
  // Cuenta deshabilitada según el perfil (tiene prioridad máxima)
  const isProfileDisabled = profStatus === 'disabled' || (profEnabled === false && profStatus !== 'active_trial');

  /**
   * isCourseVisible — ÚNICA fuente de verdad para bloqueo/acceso de cursos.
   * Orden de prioridad (de mayor a menor):
   *  0. Sin suscripción activa => bloquear todo (excepto revokes/grants explícitos)
   *  1. Revocación explícita del admin => siempre bloqueado
   *  2. Concesión explícita del admin  => siempre visible
   *  3. Plan gratuito admin (free_admin, active) => acceso por nivel (sin nivel = todo)
   *  4. Cancelado => bloqueado
   *  5. Deshabilitado por admin (account_enabled=false) => bloqueado
   *  6. Trial (status=trial) => solo A1
   *  7. Pago pendiente de aprobación => bloqueado
   *  8. Plan activo + aprobado => acceso por nivel (sin nivel = A1 por defecto)
   */
  const isCourseVisible = (course: DBCourseRow): boolean => {
    // Prioridad 1: revocación explícita
    if (revokedModuleIds.includes(course.id)) return false;
    // Prioridad 2: concesión explícita
    if (grantedModuleIds.includes(course.id)) return true;

    // Sin suscripción => solo acceso si hay grant explícito (ya chequeado arriba)
    if (!subscription) return false;

    // Prioridad 3: plan free_admin activo => acceso completo
    if (subPlan === 'free_admin' && subStatus === 'active') {
      if (!studentLevel) return true;
      const req = course.required_level || course.level;
      const idx = LEVEL_ORDER.indexOf(req);
      if (idx <= studentLevelIdx) return true;
      if (idx === studentLevelIdx + 1) return completedLevels.includes(LEVEL_ORDER[studentLevelIdx]);
      return false;
    }

    // Prioridad 4: cancelado
    if (subStatus === 'cancelled') return false;

    // Prioridad 5: deshabilitado — perfil tiene prioridad sobre subscription
    if (isProfileDisabled) return false;
    if (subEnabled === false && !isProfileActive) return false;

    // Prioridad 6: trial activo => solo A1
    if (isTrial7) {
      const lvl = course.required_level || course.level;
      return lvl === 'A1';
    }

    // Prioridad 7: pendiente de aprobación
    if (isPendingPayment) return false;

    // Prioridad 8a: cuenta activa por perfil (admin habilitó directo en student_profiles)
    if (isProfileActive) {
      if (!studentLevel) {
        const lvl = course.required_level || course.level;
        return lvl === 'A1';
      }
      const req = course.required_level || course.level;
      const idx = LEVEL_ORDER.indexOf(req);
      if (idx <= studentLevelIdx) return true;
      if (idx === studentLevelIdx + 1) return completedLevels.includes(LEVEL_ORDER[studentLevelIdx]);
      return false;
    }

    // Prioridad 8b: plan activo y aprobado en subscription
    if (subStatus === 'active' && subApproved === true && subEnabled === true) {
      if (!studentLevel) {
        const lvl = course.required_level || course.level;
        return lvl === 'A1';
      }
      const req = course.required_level || course.level;
      const idx = LEVEL_ORDER.indexOf(req);
      if (idx <= studentLevelIdx) return true;
      if (idx === studentLevelIdx + 1) return completedLevels.includes(LEVEL_ORDER[studentLevelIdx]);
      return false;
    }

    // Por defecto bloquear
    return false;
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledSlots = sessionSlots.filter(s => s.date || s.topic);
    if (filledSlots.length === 0) return;
    setSessionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Save to DB
      await supabase.from('session_requests').insert({
        student_id: user?.id || null,
        student_name: sessionName,
        student_email: sessionEmail,
        sessions: filledSlots,
        weekly_plan: sessionWeekly,
        weekly_hours: sessionWeekly ? sessionWeeklyHours : null,
        weekly_schedule: sessionWeekly ? sessionWeeklySchedule : null,
        objective: sessionObjective || null,
      });
      // Send email notification to admin
      await supabase.functions.invoke('send-session-email', {
        body: {
          type: 'session_request',
          studentName: sessionName,
          studentEmail: sessionEmail,
          sessions: filledSlots,
          weekly: sessionWeekly,
          weeklyHours: sessionWeeklyHours,
          weeklySchedule: sessionWeeklySchedule,
          objective: sessionObjective,
        },
      });
    } catch (_) { /* ignore, still show success */ }
    setSessionLoading(false);
    setSessionSent(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const patch = {
      full_name: profileForm.name.trim() || null,
      phone: profileForm.phone.trim() || null,
      country: profileForm.country.trim() || null,
      city: profileForm.city.trim() || null,
      birthday: profileForm.birthday || null,
      education_level: studentProfile?.education_level || null,
      education_other: studentProfile?.education_other || null,
      updated_at: new Date().toISOString(),
    };
    // Upsert asegura crear o actualizar el perfil
    const { error: saveErr } = await supabase
      .from('student_profiles')
      .upsert({ id: user.id, ...patch }, { onConflict: 'id' });
    if (saveErr) {
      console.error('Profile save error:', saveErr);
    }    setLoading(false);
    await refreshProfile(user.id);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw.length < 6) { setPwError('La nueva contraseña debe tener mínimo 6 caracteres'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setLoading(false);
    if (error) {
      if (error.message.includes('Auth session missing') || error.message.includes('session')) {
        setPwError('Tu sesión expiró. Por favor, cierra sesión e inicia de nuevo para cambiar la contraseña.');
      } else {
        setPwError(error.message);
      }
      return;
    }
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  const handleLogout = () => {
    onLogout?.();
    navigate(ROUTE_PATHS.HOME);
  };

  // Not logged in guard
  if (!isLoggedIn) {
    return (
      <Layout isLoggedIn={false} onOpenAuth={onOpenAuth} onLogout={onLogout}>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <p className="text-6xl mb-6">🔐</p>
            <h2 className="text-3xl font-bold mb-3">Accede a tu cuenta</h2>
            <p className="text-muted-foreground mb-8">Inicia sesión o regístrate para ver tu perfil de estudiante.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="rounded-full bg-primary text-primary-foreground px-8" onClick={() => onOpenAuth?.('register')}>Registrarse gratis 🎉</Button>
              <Button variant="outline" className="rounded-full px-8" onClick={() => onOpenAuth?.('login')}>Iniciar sesión</Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Use profile name from DB (more up-to-date) or fall back to prop
  const displayName = profileForm.name || userName || 'Estudiante';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-background flex flex-col">

{/* ── MODAL PAYPAL/PSE EMERGENTE ── */}
      {showPaypalModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaypalModal(false)} />
            <motion.div
              className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <button
                onClick={() => setShowPaypalModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-lg"
              >
                ×
              </button>
              <h3 className="font-extrabold text-xl mb-1">Completar pago 💳</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monto a pagar: <strong>${paypalModalAmount.toFixed(2)} USD</strong>
              </p>

              {/* Tabs — PayPal / PSE */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModalTab('paypal')}
                    className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all ${
                      modalTab==='paypal' ? 'border-[#003087] bg-[#003087]/5 text-[#003087]' : 'border-border/40 text-muted-foreground'
                    }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 inline mr-1 fill-current"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
                    PayPal
                  </button>
                  <button onClick={() => setModalTab('pse')}
                    className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all ${
                      modalTab==='pse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border/40 text-muted-foreground'
                    }`}>
                    🏦 PSE / Transferencia
                  </button>
                </div>

                {modalTab === 'paypal' && (
                  <div className="rounded-2xl border-2 border-[#FFC439]/60 bg-[#FFC439]/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-[#003087]">Instrucciones — PayPal</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Accede a tu cuenta de PayPal</li>
                      <li>Envía <strong>${paypalModalAmount.toFixed(2)} USD</strong> a la cuenta BLANG</li>
                      <li>En el concepto escribe tu nombre + correo</li>
                      <li>Envía el comprobante al administrador</li>
                    </ol>
                    <a href={payConfig['paypal_link'] || 'https://paypal.me/blangenglish'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                      <ExternalLink className="w-3 h-3" /> Ir a PayPal para pagar →
                    </a>
                    <PayPalHostedButton />
                    <p className="text-xs text-muted-foreground">✅ Tu cuenta se activará en máximo 48h al confirmar el pago.</p>
                  </div>
                )}

                {modalTab === 'pse' && (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-800">Instrucciones — PSE / Transferencia bancaria (Colombia)</p>
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      {payConfig['pse_bank_name'] ? (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Banco:</span><span className="font-semibold">{payConfig['pse_bank_name']}</span>
                          <span className="text-muted-foreground">Tipo de cuenta:</span><span className="font-semibold">{payConfig['pse_account_type'] || 'Ahorros'}</span>
                          {payConfig['pse_account_number'] && (<><span className="text-muted-foreground">N° de cuenta:</span><span className="font-bold font-mono">{payConfig['pse_account_number']}</span></>)}
                          {payConfig['pse_owner_name'] && (<><span className="text-muted-foreground">Titular:</span><span className="font-semibold">{payConfig['pse_owner_name']}</span></>)}
                          <span className="text-muted-foreground">Monto:</span><span className="font-extrabold text-emerald-700">${paypalModalAmount.toFixed(2)} USD</span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700">📌 Los datos bancarios serán enviados a tu correo al confirmar la solicitud.</p>
                      )}
                    </div>
                    <p className="text-xs font-bold">Envía el comprobante a:</p>
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                      <span className="text-xs font-mono flex-1 truncate">blangenglishlearning@blangenglish.com</span>
                      <button onClick={() => { navigator.clipboard.writeText('blangenglishlearning@blangenglish.com'); setModalCopied(true); setTimeout(()=>setModalCopied(false),2000); }} className="text-primary shrink-0">
                        {modalCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-amber-700">⚠️ Pago manual. Tu cuenta se activa en máximo 48h hábiles tras confirmar.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
      )}

      {/* ── TOP HEADER (logged-in only) ── */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => navigate(ROUTE_PATHS.HOME)} className="flex items-center">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-9 w-auto" />
            </button>
            {/* Profile trigger */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hola, <span className="font-bold text-primary">{displayName}</span>
              </span>
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-background rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              {/* Profile header */}
              <div className="bg-gradient-to-br from-primary to-purple-600 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur mx-auto mb-3 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border-4 border-white/30">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-white text-lg leading-tight">{displayName}</p>
                {/* Level badge */}
                {studentProfile?.english_level && (
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <span className="bg-white/25 border border-white/30 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      Nivel {studentProfile.english_level}
                    </span>
                  </div>
                )}
                {!studentProfile?.english_level && (
                  <p className="text-white/60 text-xs mt-1">Estudiante BLANG</p>
                )}
                <div className="flex items-center justify-center gap-1 mt-3 bg-white/15 rounded-full px-3 py-1 w-fit mx-auto">
                  <Flame className="w-3.5 h-3.5 text-orange-300" />
                  <span className="text-white/90 text-xs font-bold">{streakDays} {streakDays === 1 ? 'día' : 'días'} de racha</span>
                </div>
              </div>

              {/* Nav items */}
              <nav className="p-2">
                {([
                  { id: 'cursos',   icon: BookOpen,    label: 'Mis Cursos' },
                  { id: 'sesion',   icon: Video,       label: 'Sesión con Profesor' },
                  { id: 'cuenta',   icon: User,        label: 'Cuenta' },
                  { id: 'pagos',    icon: CreditCard,  label: 'Pagos' },
                  { id: 'ayuda',    icon: HelpCircle,  label: 'Ayuda' },
                ] as { id: TabId; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeTab === id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}

                <div className="border-t border-border/50 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* ─── CURSOS ─── */}
              {activeTab === 'cursos' && (
                <motion.div key="cursos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                  {/* Renewal alert */}
                  {showRenewalAlert && subscription?.payment_method && (subscription.payment_method === 'pse' || subscription.payment_method === 'paypal') && subscription.renewal_due_at && (
                    <div className="mb-4">
                      <RenewalAlert
                        paymentMethod={subscription.payment_method as 'pse' | 'paypal'}
                        dueDate={subscription.renewal_due_at}
                        onDismiss={() => setShowRenewalAlert(false)}
                      />
                    </div>
                  )}

                  <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">¡Empecemos con los cursos! 🚀</h1>
                    <p className="text-muted-foreground text-sm">Selecciona un nivel para comenzar o continuar tu aprendizaje.</p>
                  </div>

                  {/* ── Stats: racha, unidades, nivel ── */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><Flame className="w-5 h-5 text-orange-500" /></div>
                      <p className="text-2xl font-extrabold">{streakDays}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Días de racha</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                      <p className="text-2xl font-extrabold">{realCompletedUnits}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Unidades completadas</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><Award className="w-5 h-5 text-violet-500" /></div>
                      <p className="text-xl font-extrabold leading-tight">{studentProfile?.english_level || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Nivel actual</p>
                    </div>
                  </div>

                  {/* ── Banner: sin suscripción o cancelada → ir a pagos ── */}
                  {(!subscription || subscription.status === 'cancelled') && (
                    <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-foreground">{subscription?.status === 'cancelled' ? '¡Tu suscripción fue cancelada! 🔒' : 'Elige un plan para habilitar tus cursos 🎓'}</p>
                          <p className="text-sm text-muted-foreground mt-1">Tu cuenta está deshabilitada. Ve a Pagos para reactivar tu acceso por $15 USD o $55,000 COP al mes.</p>
                          <Button size="sm" className="mt-3 rounded-xl gap-1.5" onClick={() => setActiveTab('pagos')}>
                            <CreditCard className="w-3.5 h-3.5" /> Ir a Pagos y elegir plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment pending warning — PSE/PayPal not yet approved */}
                  {subscription && (subscription.payment_method === 'pse' || subscription.payment_method === 'paypal') && subscription.approved_by_admin === false && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-amber-800">⏳ Pago pendiente de aprobación</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Seleccionaste <strong>{subscription.payment_method === 'pse' ? 'PSE' : 'PayPal'}</strong>. Los cursos se habilitarán una vez que el administrador confirme tu pago (1–24h hábiles).
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5"
                            onClick={() => setActiveTab('pagos')}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Ver instrucciones de pago
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Banner examen de inglés pendiente (asignado por admin) ── */}
                  {studentProfile?.onboarding_step === 'english_test' && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50/60 p-5 shadow-sm mb-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400" />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">🧪</div>
                        <div className="flex-1">
                          <p className="font-extrabold text-orange-900 text-base">¡Examen de nivel pendiente!</p>
                          <p className="text-sm text-orange-800 mt-1 mb-3">Para desbloquear tus cursos necesitas completar el examen de inglés. El sistema asignará tu nivel automáticamente al terminar.</p>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-1.5 font-bold"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            🎓 Tomar examen ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Level not set warning — solo si NO tiene examen pendiente (ese tiene su propio banner) */}
                  {studentProfile && !studentProfile.english_level && !isTrial7 && subscription?.account_enabled === true && !isPendingPayment && studentProfile?.onboarding_step !== 'english_test' && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-amber-800">Cursos bloqueados</p>
                          <p className="text-sm text-amber-700 mt-1">Debes seleccionar tu nivel de inglés para desbloquear los cursos. Puedes hacer el <strong>examen de nivel</strong> o <strong>elegir directamente</strong>.</p>
                          <Button
                            size="sm"
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            <FlaskConical className="w-3.5 h-3.5" /> Definir mi nivel ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {dbCourses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Los cursos se cargarán pronto.</p>
                    </div>
                  )}

                  {coursesLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Cargando cursos...</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {dbCourses.map((course) => {
                      const colors = LEVEL_COLORS[course.level] || LEVEL_COLORS['A1'];
                      const isOpen = expandedCourse === course.id;
                      const units = courseUnits[course.id] || [];
                      // isCourseVisible ya contiene TODA la lógica (grant, revoke, trial, plan, nivel)
                      const isVisible = isCourseVisible(course);
                      const isLocked = !isVisible;
                      const requiredLevel = course.required_level || course.level;
                      const courseIdx = LEVEL_ORDER.indexOf(requiredLevel);
                      const prevLevel = courseIdx > 0 ? LEVEL_ORDER[courseIdx - 1] : null;
                      return (
                        <div key={course.id} className={`rounded-2xl border-2 overflow-hidden bg-gradient-to-br ${colors.color} ${isLocked ? 'opacity-60' : ''}`}>
                          {/* Course header */}
                          <button
                            type="button"
                            onClick={() => !isLocked && toggleCourse(course.id)}
                            className={`w-full flex items-start gap-3 p-5 text-left transition-colors ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5'}`}
                          >
                            <span className={`text-3xl ${isLocked ? 'grayscale opacity-50' : ''}`}>{course.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge} inline-block`}>{course.level}</span>
                                {isLocked && prevLevel && (
                                  <span className="text-xs text-muted-foreground">🔒 Completa {prevLevel} primero</span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm leading-snug">{course.title}</h3>
                              <p className="text-xs text-muted-foreground">{course.total_units} unidades</p>
                            </div>
                            {isLocked
                              ? <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                              : isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                          </button>

                          {/* Units list */}
                          {isOpen && (
                            <div className="bg-background/80 border-t border-border/50 p-4 space-y-2">
                              {loadingUnits === course.id && (
                                <p className="text-xs text-center text-muted-foreground py-3">Cargando unidades...</p>
                              )}
                              {loadingUnits !== course.id && units.length === 0 && (
                                <p className="text-xs text-center text-muted-foreground py-3">No hay unidades publicadas aún en este curso</p>
                              )}
                              {units.map(unit => {
                                const unitProg = unitProgressMap[unit.id] || 0;
                                const totalStages = 5;
                                const progPct = Math.round((unitProg / totalStages) * 100);
                                return (
                                <button
                                  key={unit.id}
                                  type="button"
                                  onClick={() => setViewerUnit({ id: unit.id, title: unit.title, description: unit.description })}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    unitProg >= totalStages ? 'bg-green-100' : 'bg-primary/10'
                                  }`}>
                                    {unitProg >= totalStages
                                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      : <BookOpen className="w-4 h-4 text-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{unit.title}</p>
                                    {unitProg > 0 ? (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progPct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{unitProg}/{totalStages}</span>
                                      </div>
                                    ) : (
                                      unit.description && <p className="text-xs text-muted-foreground truncate">{unit.description}</p>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ─── SESIÓN CON PROFESOR ─── */}
              {activeTab === 'sesion' && (
                <motion.div key="sesion" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Sesión con el Profesor 🎓</h1>
                    <p className="text-muted-foreground text-sm">Reserva una clase 1 a 1 personalizada con el profesor.</p>
                  </div>

                  {/* Info notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                    <p className="font-bold mb-1">📌 Importante sobre las sesiones</p>
                    <p>Las sesiones con el profesor <strong>no reemplazan</strong> tu aprendizaje en la plataforma. Son un complemento para <strong>explicar un tema</strong> específico o <strong>practicar speaking</strong> en vivo. Sigue avanzando en tus cursos para sacar el mayor provecho.</p>
                  </div>

                  {/* Header banner */}
                  <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 pt-6 pb-10">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                      <div className="relative flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden shrink-0 shadow-lg">
                          <img src={IMAGES.INSTRUCTOR_NOBG} alt="Profesor" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">✨ Clases 1 a 1</span>
                          </div>
                          <h2 className="font-extrabold text-xl leading-tight">Sesión con el profesor</h2>
                          <p className="text-white/80 text-sm mt-0.5">Personalizada · $10 USD / hora</p>
                        </div>
                      </div>
                      <div className="relative flex flex-wrap gap-2 mt-4">
                        {['🎯 Conversación', '📝 Gramática', '🗣️ Pronunciación', '💼 Business English'].map(tag => (
                          <span key={tag} className="text-xs bg-white/15 border border-white/20 text-white px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Form card */}
                    <div className="-mt-5 mx-4 mb-4 bg-background rounded-2xl border border-border/50 shadow-md p-5">
                      {sessionSent ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Check className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="font-bold text-green-700 text-xl">¡Solicitud enviada! 🎉</p>
                          <p className="text-sm text-muted-foreground mt-2 mb-5">Revisaremos tu solicitud y te contactaremos pronto para confirmar horario y método de pago.</p>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => {
                            setSessionSent(false);
                            setSessionSlots([{ date: '', topic: '' }]);
                            setSessionWeekly(false);
                            setSessionWeeklyHours('');
                            setSessionWeeklySchedule('');
                            setSessionObjective('');
                          }}>Enviar otra solicitud</Button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSessionSubmit} className="space-y-5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Solicitar sesión</p>

                          {/* Contact info */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">Tu nombre</Label>
                              <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Nombre completo" className="rounded-xl h-9 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">Correo de contacto</Label>
                              <Input type="email" value={sessionEmail} onChange={e => setSessionEmail(e.target.value)} placeholder="tu@correo.com" className="rounded-xl h-9 text-sm" required />
                            </div>
                          </div>

                          {/* Dynamic session slots */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📅 Fecha(s) que deseas reservar</Label>
                            </div>
                            {sessionSlots.map((slot, idx) => (
                              <div key={idx} className="flex gap-2 items-start bg-muted/30 rounded-xl p-3 border border-border/40">
                                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Fecha preferida</Label>
                                    <Input
                                      type="date"
                                      value={slot.date}
                                      min={new Date().toISOString().split('T')[0]}
                                      onChange={e => {
                                        const updated = [...sessionSlots];
                                        updated[idx] = { ...updated[idx], date: e.target.value };
                                        setSessionSlots(updated);
                                      }}
                                      className="rounded-xl h-9 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Tema o propósito</Label>
                                    <Input
                                      placeholder="Ej: Practicar speaking, revisar gramática..."
                                      value={slot.topic}
                                      onChange={e => {
                                        const updated = [...sessionSlots];
                                        updated[idx] = { ...updated[idx], topic: e.target.value };
                                        setSessionSlots(updated);
                                      }}
                                      className="rounded-xl h-9 text-sm"
                                    />
                                  </div>
                                </div>
                                {sessionSlots.length > 1 && (
                                  <button type="button" onClick={() => setSessionSlots(prev => prev.filter((_, i) => i !== idx))}
                                    className="mt-5 p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button"
                              onClick={() => setSessionSlots(prev => [...prev, { date: '', topic: '' }])}
                              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                              <Plus className="w-4 h-4" /> Agregar otra fecha
                            </button>
                          </div>

                          {/* Objective */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">🎯 Tu objetivo con las sesiones <span className="text-muted-foreground/60">(opcional)</span></Label>
                            <textarea
                              value={sessionObjective}
                              onChange={e => setSessionObjective(e.target.value)}
                              rows={2}
                              placeholder="Ej: Mejorar mi fluidez para entrevistas de trabajo, preparar un examen, perder el miedo a hablar..."
                              className="w-full rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>

                          {/* Weekly plan toggle */}
                          <div className={`rounded-2xl border-2 p-4 transition-all ${
                            sessionWeekly ? 'border-violet-300 bg-violet-50/60' : 'border-border/40 bg-muted/20'
                          }`}>
                            <button type="button"
                              onClick={() => setSessionWeekly(v => !v)}
                              className="w-full flex items-center justify-between gap-3 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  sessionWeekly ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">¿Quieres más de 1 clase a la semana?</p>
                                  <p className="text-xs text-muted-foreground">Servicio personalizado — cuéntanos tu disponibilidad</p>
                                </div>
                              </div>
                              <div className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
                                sessionWeekly ? 'bg-violet-600' : 'bg-muted-foreground/30'
                              }`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                  sessionWeekly ? 'left-6' : 'left-1'
                                }`} />
                              </div>
                            </button>

                            <AnimatePresence>
                              {sessionWeekly && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 space-y-3 pt-4 border-t border-violet-200/60">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-medium text-violet-700">¿Cuántas horas semanales deseas reservar?</Label>
                                      <Input
                                        placeholder="Ej: 2 horas por semana, 3 sesiones de 1 hora..."
                                        value={sessionWeeklyHours}
                                        onChange={e => setSessionWeeklyHours(e.target.value)}
                                        className="rounded-xl h-9 text-sm border-violet-200 focus-visible:ring-violet-400"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-medium text-violet-700">¿Qué horas tienes disponibles durante la semana?</Label>
                                      <textarea
                                        value={sessionWeeklySchedule}
                                        onChange={e => setSessionWeeklySchedule(e.target.value)}
                                        rows={3}
                                        placeholder="Ej: Lunes y miércoles de 7-9pm, sábados por la mañana de 9am-12pm, viernes cualquier hora..."
                                        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                                      />
                                    </div>
                                    <div className="bg-violet-100/60 rounded-xl p-3 text-xs text-violet-700">
                                      <p className="font-semibold mb-1">💡 Plan personalizado semanal</p>
                                      <p>Te contactaremos para armar un horario fijo que se adapte a tu rutina. Precio especial para paquetes semanales.</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <Button
                            type="submit"
                            disabled={sessionLoading || sessionSlots.every(s => !s.date && !s.topic)}
                            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-violet-200 py-6"
                          >
                            {sessionLoading ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enviando...
                              </span>
                            ) : 'Solicitar sesión — $10 USD / hora 🎓'}
                          </Button>
                          <div className="flex items-center justify-center flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>✅ Sin compromiso</span>
                            <span>📧 Respuesta en 24h</span>
                            <span>💳 Pago al confirmar</span>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── CUENTA ─── */}
              {activeTab === 'cuenta' && (
                <motion.div key="cuenta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Mi Cuenta 👤</h1>
                    <p className="text-muted-foreground text-sm">Tu información personal y configuración.</p>
                  </div>

                  {/* Profile summary card */}
                  {profileLoading ? (
                    <div className="bg-gradient-to-br from-primary/5 to-background rounded-2xl border border-primary/20 p-5 shadow-sm animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 rounded bg-primary/20 w-3/5" />
                          <div className="h-3 rounded bg-muted w-2/5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/5 via-violet-50/50 to-background rounded-2xl border border-primary/20 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-extrabold shadow-md shrink-0">
                        {(profileForm.name || userName || 'E').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-lg leading-tight">{profileForm.name || userName || 'Estudiante'}</p>
                          {studentProfile?.english_level && (
                            <span className="text-xs font-extrabold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                              Nivel {studentProfile.english_level}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{currentEmail}</p>
                        {/* Personal details row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {studentProfile?.birthday && (() => {
                            const birth = new Date(studentProfile.birthday!);
                            const today = new Date();
                            let age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                            return (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {birth.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · {age} años
                              </span>
                            );
                          })()}
                          {(studentProfile?.country || studentProfile?.city) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {[studentProfile.city, studentProfile.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                          {studentProfile?.education_level && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GraduationCap className="w-3 h-3" />
                              {{ bachiller: 'Bachiller', universitario: 'Universitario', posgrado: 'Posgrado', trabajo: 'Laboral', otro: 'Otro' }[studentProfile.education_level] || studentProfile.education_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {/* Solicitud de actualización de datos */}
                  <UpdateRequestForm
                    studentName={profileForm.name || userName || ''}
                    studentEmail={currentEmail}
                  />

                  {/* Change password */}
                  <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Cambiar contraseña</h2>
                    <form onSubmit={handlePwSave} className="space-y-4">
                      {/* Current password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-cur" className="text-sm font-medium">Contraseña actual</Label>
                        <div className="relative">
                          <Input
                            id="pw-cur"
                            type={showPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={pwForm.current}
                            onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                            className="rounded-xl pr-10"
                            required
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* New password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-new" className="text-sm font-medium">Nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-new"
                            type={showNewPw ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={pwForm.newPw}
                            onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                            className="rounded-xl pr-10"
                            required
                            minLength={6}
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* Confirm new password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-cfm" className="text-sm font-medium">Confirmar nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-cfm"
                            type={showConfirmPw ? 'text' : 'password'}
                            placeholder="Repite tu nueva contraseña"
                            value={pwForm.confirm}
                            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                            className={`rounded-xl pr-10 ${
                              pwForm.confirm.length > 0
                                ? pwForm.confirm === pwForm.newPw
                                  ? 'border-green-400 focus-visible:ring-green-400'
                                  : 'border-destructive focus-visible:ring-destructive'
                                : ''
                            }`}
                            required
                          />
                          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Inline feedback */}
                        {pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.newPw && (
                          <p className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Las contraseñas no coinciden
                          </p>
                        )}
                        {pwForm.confirm.length > 0 && pwForm.confirm === pwForm.newPw && (
                          <p className="flex items-center gap-1.5 text-xs text-green-600">
                            <Check className="w-3.5 h-3.5 shrink-0" /> ¡Las contraseñas coinciden!
                          </p>
                        )}
                      </div>
                      {pwError && (
                        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{pwError}</span>
                        </div>
                      )}
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-xl px-6 h-9 text-sm"
                        disabled={loading || (pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.newPw)}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Actualizando...
                          </span>
                        ) : pwSaved ? (
                          <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> ¡Contraseña actualizada!</span>
                        ) : 'Actualizar contraseña'}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ─── PAGOS ─── */}
              {activeTab === 'pagos' && (
                <motion.div key="pagos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Pagos y Suscripción 💳</h1>
                    <p className="text-muted-foreground text-sm">Gestiona tu plan y tus pagos.</p>
                  </div>

                  {/* ── BANNER EXAMEN DE INGLÉS (cuando admin asignó "Ninguna") ── */}
                  {studentProfile?.onboarding_step === 'english_test' && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50/60 p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400" />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">🧪</div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-orange-900 text-base mb-1">🎓 Examen de nivel pendiente</h3>
                          <p className="text-sm text-orange-800 mb-4">
                            Para activar tus cursos necesitas completar el examen de inglés. El sistema asignará tu nivel automáticamente al terminar.
                          </p>
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-1.5 font-bold w-full sm:w-auto"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            🎓 Tomar examen ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════════════════════════
                       BLOQUE DE PAGOS — estado derivado de student_profiles + subscriptions
                       Fuentes de verdad (BD real):
                         student_profiles.account_status: 'pending'|'trial'|'active'|'disabled'|'cancelled'
                         student_profiles.account_enabled: boolean
                         student_profiles.onboarding_step: 'pending_plan'|'english_test'|'completed'
                         subscriptions.status / plan_slug
                  ════════════════════════════════════════════════════════════ */}
                  {(() => {
                    const sub = subscription;
                    const prof = studentProfile; // ← datos reales de la BD
                    const now = new Date();

                    // ─── Estado explícito derivado de la BD ───
                    type EstadoUsuario =
                      | 'primer_registro'   // nuevo: onboarding_step='pending_plan', sin sub
                      | 'prueba_activa'     // account_status='trial', trial no vencido
                      | 'prueba_finalizada' // trial vencido / status='cancelled'
                      | 'pendiente_pago'    // envió comprobante, admin revisando
                      | 'deshabilitado'     // admin deshabilitó (account_enabled=false)
                      | 'free_admin'        // admin dio acceso gratuito
                      | 'activo';           // pago aprobado, acceso completo

                    const getEstado = (): EstadoUsuario => {
                      // ═══════════════════════════════════════════════════
                      // FUENTE DE VERDAD: student_profiles.account_status
                      // Se escribe directamente al activar/cambiar estado
                      // ═══════════════════════════════════════════════════

                      // P1: Deshabilitado — bloquea todo (va primero)
                      if (prof?.account_status === 'disabled') return 'deshabilitado';
                      if (prof?.account_enabled === false && prof?.account_status !== 'active_trial') return 'deshabilitado';

                      // P2: Trial ACTIVO — account_status='active_trial' (fuente primaria)
                      if (prof?.account_status === 'active_trial' || prof?.trial_active === true) {
                        const endDate = prof?.trial_end_date
                          ? new Date(prof.trial_end_date)
                          : (sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null);
                        if (endDate && endDate < now) return 'prueba_finalizada';
                        return 'prueba_activa';
                      }

                      // P3: Trial vencido explícito
                      if (prof?.account_status === 'expired_trial') return 'prueba_finalizada';

                      // P4: Pago pendiente explícito
                      if (prof?.account_status === 'pending_payment') return 'pendiente_pago';

                      // P5: Cuenta activa explícita
                      if (prof?.account_status === 'active' && prof?.account_enabled === true) return 'activo';

                      // ── Fallback: derivar del estado de subscripción ──

                      // Admin acceso gratuito
                      if (sub?.plan_slug === 'free_admin' && sub?.status === 'active') return 'free_admin';

                      // Sub activa aprobada
                      if (sub?.status === 'active' && sub?.account_enabled === true) return 'activo';

                      // Trial por subscripción (legacy)
                      if (sub?.plan_slug === 'free_trial' || sub?.status === 'trial' || sub?.trial_active === true) {
                        if (sub?.status !== 'cancelled') {
                          const endDate = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;
                          if (endDate && endDate < now) return 'prueba_finalizada';
                          return 'prueba_activa';
                        }
                      }

                      // Sub cancelada
                      if (sub?.status === 'cancelled' || prof?.account_status === 'cancelled') return 'prueba_finalizada';

                      // Pago pendiente por sub
                      if (sub?.status === 'pending_approval' || sub?.status === 'pending') return 'pendiente_pago';
                      if (sub?.approved_by_admin === false) return 'pendiente_pago';
                      if (prof?.account_status === 'pending' && sub !== null) return 'pendiente_pago';

                      // Sub deshabilitada
                      if (sub?.account_enabled === false) return 'deshabilitado';

                      // Sin datos suficientes → primer registro
                      if (!sub) return 'primer_registro';

                      return 'activo';
                    };

                    const estado = getEstado();
                    const fmt = (d: Date | null) => d ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
                    // trialEnd: usar trial_end_date del perfil (guardado al activar), luego sub, luego fallback
                    const trialEnd = prof?.trial_end_date
                      ? new Date(prof.trial_end_date)
                      : sub?.trial_ends_at
                        ? new Date(sub.trial_ends_at)
                        : prof?.created_at
                          ? new Date(new Date(prof.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
                          : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    // regDate: usar trial_start_date del perfil, luego sub.created_at
                    const regDate = prof?.trial_start_date
                      ? new Date(prof.trial_start_date)
                      : sub?.created_at
                        ? new Date(sub.created_at)
                        : prof?.created_at ? new Date(prof.created_at) : now;
                    const nextBilling = sub?.current_period_end ? new Date(sub.current_period_end) : null;
                    const onPay = (amount: number, _label: string) => { setPaypalModalAmount(amount); setShowPaypalModal(true); };

// ─── PRIMER_REGISTRO: nuevo estudiante — muestra opciones SIN auto-activar ───
                    if (estado === 'primer_registro') {
                      return (
                        <div className="space-y-4">
                          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">👋</div>
                              <div className="flex-1">
                                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-primary/10 text-primary">Bienvenido/a</span>
                                <h2 className="font-extrabold text-xl mb-1">¡Hola en BLANG English!</h2>
                                <p className="text-sm text-muted-foreground">
                                  Elige cómo quieres comenzar: solicita 7 días de prueba gratuita o paga el plan mensual ($15 USD / $55,000 COP).
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button
                                className="w-full rounded-2xl py-5 font-extrabold text-base"
                                onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                              >
                                🚀 Ver mis opciones de acceso
                              </Button>
                              <p className="text-xs text-center text-muted-foreground">Sin compromisos — elige la opción que mejor te convenga</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ─── FREE_ADMIN: sin pagos ───
                    if (estado === 'free_admin') {
                      return (
                        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-8 flex flex-col items-center text-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">🎁</div>
                          <div>
                            <h2 className="font-extrabold text-xl text-violet-900 mb-1">Sin pagos pendientes</h2>
                            <p className="text-sm text-violet-700">El administrador ha habilitado tu acceso de forma gratuita. No tienes ningún cobro pendiente.</p>
                          </div>
                          <span className="inline-block bg-violet-100 text-violet-700 font-bold text-sm px-4 py-2 rounded-full">✨ Acceso completo sin costo</span>
                        </div>
                      );
                    }

                    // ─── PRUEBA_ACTIVA: período de 7 días en curso ───
                    // Solo 2 botones: "Quiero pagar" (abre OnboardingFlow en PAYMENT_SELECTION) y "Terminar"
                    if (estado === 'prueba_activa') {
                      return (
                        <TrialPaymentActiveBlock
                          fmt={fmt}
                          trialEnd={trialEnd}
                          regDate={regDate}
                          payConfig={payConfig}
                          onCancelTrial={async () => {
                            // Botón 2: Cancelar suscripción — desactiva cuenta completamente en BD
                            if (currentUserId) {
                              await supabase.from('student_profiles').update({
                                trial_active: false,
                                account_status: 'disabled',
                                account_enabled: false,
                              }).eq('id', currentUserId);
                              await supabase.from('subscriptions').update({
                                trial_active: false,
                                status: 'cancelled',
                                account_enabled: false,
                              }).eq('student_id', currentUserId);
                              await supabase.from('payment_history').insert({
                                student_id: currentUserId,
                                event_type: 'cancelled',
                                amount_usd: 0,
                                payment_method: 'none',
                                notes: 'Usuario canceló suscripción desde prueba activa',
                              });
                              // Recargar perfil reactivamente (sin reload de página)
                              await refreshProfile(currentUserId);
                            }
                          }}
                          onWantPay={async () => {
                            // Botón 1: Pagar plan mensual — finaliza trial y abre formulario de pago
                            if (currentUserId) {
                              await supabase.from('student_profiles').update({
                                trial_active: false,
                                account_status: 'pending_payment',
                              }).eq('id', currentUserId);
                              await supabase.from('subscriptions').update({
                                trial_active: false,
                                status: 'pending',
                              }).eq('student_id', currentUserId);
                            }
                            setOnboardingInitialStep('plan');
                            setShowLevelOnboarding(true);
                          }}
                        />
                      );
                    }

                    // ─── PRUEBA_FINALIZADA / sin suscripción / cancelada ───
                    // ⚠️ SOLO llegan aquí estudiantes cuya prueba ya venció
                    // ⚠️ No es lo mismo que 'deshabilitado' — usa modo trial_expired
                    if (estado === 'prueba_finalizada') {
                      return (
                        <TrialPaymentBlock
                          fmtDate={fmt}
                          trialEnd={trialEnd}
                          payConfig={payConfig}
                          mode="trial_expired"
                          onSelectPlan={onPay}
                        />
                      );
                    }

                    // ─── PENDIENTE_PAGO: pagó, esperando confirmación admin ───
                    if (estado === 'pendiente_pago') {
                      return (
                        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-6 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">⏳</div>
                            <div className="flex-1">
                              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-amber-100 text-amber-700">⏳ Pago en revisión</span>
                              <h2 className="font-extrabold text-xl mb-1">Comprobante recibido</h2>
                              <p className="text-sm text-muted-foreground">Tu pago de <strong>${sub?.amount_usd ?? '—'} USD</strong> está siendo verificado por el administrador. Recibirás acceso en máximo 48 horas hábiles.</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-background/70 rounded-xl p-3 border border-border/40">
                              <p className="text-xs text-muted-foreground mb-0.5">📅 Fecha de solicitud</p>
                              <p className="font-bold text-sm">{fmt(regDate)}</p>
                            </div>
                            <div className="bg-background/70 rounded-xl p-3 border border-border/40">
                              <p className="text-xs text-muted-foreground mb-0.5">💰 Monto</p>
                              <p className="font-bold text-sm">${sub?.amount_usd ?? '—'} USD</p>
                            </div>
                          </div>
                          <p className="mt-4 text-xs text-amber-700">¿Dudas? Escríbenos a <strong>blangenglishlearning@blangenglish.com</strong></p>
                        </div>
                      );
                    }

                    // ─── DESHABILITADO: admin deshabilitó cuenta ───
                    // ⚠️ ÚNICO estado donde se muestran planes, precios y métodos de pago
                    if (estado === 'deshabilitado') {
                      return (
                        <TrialPaymentBlock
                          fmtDate={fmt}
                          trialEnd={trialEnd}
                          payConfig={payConfig}
                          mode="reactivate"
                          onSelectPlan={onPay}
                        />
                      );
                    }

                    // ─── ACTIVO: pago aprobado, todo OK ───
                    return (
                      <div className="space-y-4">
                        <div className="rounded-2xl border-2 border-green-300 bg-green-50/30 p-5 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400" />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 bg-green-100 text-green-700">✅ Suscripción activa</span>
                              <h2 className="font-extrabold text-xl">{sub?.plan_name}</h2>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-extrabold text-2xl">${sub?.amount_usd} <span className="text-sm font-normal text-muted-foreground">USD/mes</span></p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-background/70 rounded-xl p-3 border border-border/40">
                              <p className="text-xs text-muted-foreground mb-0.5">📅 Fecha de inicio</p>
                              <p className="font-bold text-sm">{fmt(regDate)}</p>
                            </div>
                            {nextBilling && (
                              <div className="bg-background/70 rounded-xl p-3 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-0.5">📆 Próximo cobro</p>
                                <p className="font-bold text-sm">{fmt(nextBilling)}</p>
                              </div>
                            )}
                            <div className="bg-background/70 rounded-xl p-3 border border-border/40">
                              <p className="text-xs text-muted-foreground mb-0.5">💰 Monto</p>
                              <p className="font-bold text-sm">${sub?.amount_usd} USD</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <p className="font-bold text-green-900">✅ Pago confirmado — acceso completo habilitado</p>
                          </div>
                          <p className="text-sm text-green-800">Tienes acceso completo a todos tus cursos.</p>
                        </div>
                      </div>
                    );
                  })()}

              {/* ── Payment History ── */}
              {activeTab === 'pagos' && paymentHistory.length > 0 && (
                <div className="bg-background rounded-2xl border border-border/50 p-5 shadow-sm mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-base">Historial de pagos</h2>
                  </div>
                  <div className="space-y-2">
                    {paymentHistory.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.event_type === 'payment_approved' ? 'bg-green-100 text-green-600' :
                            item.event_type === 'payment_pending' ? 'bg-amber-100 text-amber-600' :
                            item.event_type === 'cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {item.event_type === 'payment_approved' ? '✅' :
                             item.event_type === 'payment_pending' ? '⏳' :
                             item.event_type === 'cancelled' ? '❌' : '📋'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {item.event_type === 'payment_approved' ? 'Pago aprobado' :
                               item.event_type === 'payment_pending' ? 'Pago en revisión' :
                               item.event_type === 'cancelled' ? 'Suscripción cancelada' :
                               item.event_type === 'subscription_created' ? 'Suscripción creada' :
                               item.event_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                              {item.payment_method && item.payment_method !== 'none' && ` · ${item.payment_method.toUpperCase()}`}
                              {item.notes && ` · ${item.notes}`}
                            </p>
                          </div>
                        </div>
                        {item.amount_usd > 0 && (
                          <span className="text-sm font-bold text-green-600">${item.amount_usd} USD</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Cancelar suscripción ── */}
              {activeTab === 'pagos' && subscription && !['cancelled', 'pending_plan'].includes(subscription.status) && (
                <div className="bg-background rounded-2xl border border-destructive/20 p-6 shadow-sm mt-2">
                  <h2 className="font-bold text-base mb-2 text-destructive/80">⚠️ Cancelar suscripción</h2>
                  <p className="text-sm text-muted-foreground mb-4">Si cancelas, tu cuenta quedará <strong>deshabilitada inmediatamente</strong> hasta que realices un nuevo pago.</p>
                  {!cancelConfirm ? (
                    <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl text-sm" onClick={() => setCancelConfirm(true)}>
                      Cancelar suscripción
                    </Button>
                  ) : (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-destructive">¿Estás seguro/a de cancelar?</p>
                      <p className="text-xs text-muted-foreground">Tu cuenta se deshabilitará de inmediato. Para reactivarla deberás realizar un nuevo pago.</p>
                      <div className="flex gap-3">
                        <Button variant="destructive" size="sm" className="rounded-xl text-xs" onClick={async () => {
                          if (currentUserId) {
                            try {
                              // Llamar edge function con service_role para cancelar
                              const { error } = await supabase.functions.invoke('save-onboarding-2026', {
                                body: { action: 'cancel_subscription', student_id: currentUserId },
                              });
                              if (error) throw error;
                            } catch {
                              // Fallback: update directo
                              await supabase.from('subscriptions').update({
                                status: 'cancelled',
                                account_enabled: false,
                                approved_by_admin: false,
                              }).eq('student_id', currentUserId);
                              await supabase.from('student_profiles').update({
                                account_enabled: false,
                              }).eq('id', currentUserId);
                            }
                            // Actualizar estado local inmediatamente
                            setSubscription(s => s ? { ...s, status: 'cancelled', account_enabled: false } : null);
                            // Recargar desde BD para confirmar que se guardó
                            await refreshProfile(currentUserId);
                          }
                          setCancelConfirm(false);
                        }}>Sí, cancelar y deshabilitar</Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setCancelConfirm(false)}>No, mantener</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
                </motion.div>
              )}

              {/* ─── AYUDA ─── */}
              {activeTab === 'ayuda' && (
                <motion.div key="ayuda" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Ayuda & Soporte 💬</h1>
                    <p className="text-muted-foreground text-sm">Preguntas frecuentes sobre la plataforma.</p>
                  </div>

                  {/* Quick FAQs */}
                  <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                    <h2 className="font-bold text-base mb-4">❓ Preguntas frecuentes</h2>
                    <div className="space-y-2">
                      {FAQ_QUICK.map((faq, i) => (
                        <div key={i} className="border border-border/40 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-semibold hover:bg-muted/30 transition-colors"
                          >
                            <span>{faq.q}</span>
                            {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {openFaq === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }} className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">{faq.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-4 w-full rounded-xl text-sm border-primary/30 text-primary" onClick={() => navigate(ROUTE_PATHS.FAQ)}>
                      Ver todas las preguntas frecuentes →
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Unit viewer overlay */}
      {viewerUnit && (
        <UnitViewer
          unitId={viewerUnit.id}
          unitTitle={viewerUnit.title}
          unitDescription={viewerUnit.description}
          studentId={currentUserId}
          onClose={async () => {
            // Actualizar progreso de esta unidad en el mapa al cerrar
            if (currentUserId && viewerUnit.id) {
              const { data } = await supabase.from('unit_progress')
                .select('unit_id').eq('unit_id', viewerUnit.id)
                .eq('student_id', currentUserId).eq('completed', true);
              setUnitProgressMap(prev => ({ ...prev, [viewerUnit.id]: data?.length || 0 }));
            }
            setViewerUnit(null);
          }}
        />
      )}

      {/* Confirm dialog for data modifications */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(c => ({ ...c, open: false }))}
      />

      {/* OnboardingFlow — primer ingreso o cambio de plan */}
      {showLevelOnboarding && currentUserId && (
        <OnboardingFlow
          open={showLevelOnboarding}
          userId={currentUserId}
          userName={profileForm.name || userName || 'Estudiante'}
          userEmail={currentEmail}
          userCountry={studentProfile?.country || ''}
          userCity={studentProfile?.city || ''}
          userBirthdate={studentProfile?.birthday || ''}
          initialStep={onboardingInitialStep}
          hasPaidPlan={
            isProfileActive ||
            !!(subscription?.account_enabled === true &&
              subscription?.approved_by_admin === true &&
              subscription?.status !== 'cancelled' &&
              subscription?.status !== 'trial' &&
              subscription?.plan_slug !== 'free_trial')
          }
          onComplete={async () => {
            setShowLevelOnboarding(false);
            setOnboardingInitialStep('welcome');
            if (currentUserId) await refreshProfile(currentUserId);
          }}
          onOpenExam={() => {
            setShowLevelOnboarding(false);
            setShowLevelExam(true);
          }}
        />
      )}

      {/* LevelExam — examen de nivel real */}
      {showLevelExam && currentUserId && (
        <LevelExam
          open={showLevelExam}
          userId={currentUserId}
          onResult={async (_level, _accepted) => {
            setShowLevelExam(false);
            if (currentUserId) await refreshProfile(currentUserId);
          }}
          onClose={() => setShowLevelExam(false)}
        />
      )}
    </div>
  );
}