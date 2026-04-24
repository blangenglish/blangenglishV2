import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Calendar, GraduationCap, MapPin, ChevronDown, ArrowLeft, Search, ShieldCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IMAGES } from '@/assets/images';
import { supabase } from '@/integrations/supabase/client';
import type { AuthModal } from '@/lib/index';

type ViewMode = AuthModal | 'forgot' | 'forgot_sent';

interface AuthModalsProps {
  open: AuthModal;
  onClose: () => void;
  onLogin: (email: string, name: string, userId?: string, isAdmin?: boolean, country?: string, city?: string, isNewReg?: boolean) => void;
}

// Popular countries list
const COUNTRIES_LIST = [
  'Colombia', 'México', 'Argentina', 'España', 'Venezuela', 'Chile', 'Perú', 'Ecuador',
  'Bolivia', 'Paraguay', 'Uruguay', 'Costa Rica', 'Panamá', 'Honduras', 'Guatemala',
  'El Salvador', 'Nicaragua', 'República Dominicana', 'Cuba', 'Puerto Rico',
  'Estados Unidos', 'Canadá', 'Brasil', 'Portugal', 'Francia', 'Italia',
  'Alemania', 'Reino Unido', 'Australia', 'Nueva Zelanda', 'Japón', 'Corea del Sur',
  'China', 'India', 'Otro'
];

// SearchableSelect component
function SearchableSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
            ) : filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  value === opt ? 'bg-primary/5 text-primary font-semibold' : ''
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const EDUCATION_OPTIONS = [
  { value: 'bachiller',     label: '🎓 Bachiller / Secundaria' },
  { value: 'universitario', label: '🏛️ Universitario / Técnico' },
  { value: 'posgrado',      label: '📜 Posgrado / Maestría / PhD' },
  { value: 'trabajo',       label: '💼 Trabajo (sin título universitario)' },
  { value: 'otro',          label: '✏️ Otro' },
];

const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

export function AuthModals({ open, onClose, onLogin }: AuthModalsProps) {
  const [mode, setMode] = useState<ViewMode>(open);
  const [loginTab, setLoginTab] = useState<'student' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [education, setEducation] = useState('');
  const [educationOther, setEducationOther] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step for register (1=basic, 2=personal details)
  const [regStep, setRegStep] = useState(1);

  useEffect(() => {
    if (open !== null) {
      setMode(open);
      setSuccess(false);
      setError('');
      setRegStep(1);
      setForgotEmail('');
      setConfirmPassword('');
      setLoginTab('student');
    }
  }, [open]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setError('Ingresa tu correo electrónico'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
      });
      if (resetError) throw resetError;
      setMode('forgot_sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    if (!email.trim()) { setError('Ingresa tu correo'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return; }
    if (confirmPassword !== password) { setError('Las contraseñas no coinciden'); return; }
    setError('');
    setRegStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // SEGURIDAD: El correo de admin nunca puede registrarse como estudiante
        if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setLoading(false);
          setError('❌ Este correo está reservado para administradores. No puede usarse para crear una cuenta de estudiante.');
          return;
        }
        // ── Registro directo con Supabase Auth ──
        // Primero intentar via edge function (si existe), luego fallback directo
        let registroOk = false;
        let userId = '';

        // Intento 1: edge function (para confirmar email automáticamente)
        const { data: fnData, error: fnError } = await supabase.functions.invoke('register-student-2026', {
          body: { email, password, name, birthday: birthday || null, education: education || null, education_other: educationOther || null, country: country || null, city: city || null },
        });

        if (!fnError && !fnData?.error) {
          // Edge function exitosa
          registroOk = true;
          userId = fnData?.user_id || '';
        } else if (fnData?.error === 'already_registered') {
          throw new Error('already registered');
        } else {
          // Intento 2: registro directo
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });

          if (signUpError) {
            if (signUpError.message?.toLowerCase().includes('already registered') ||
                signUpError.message?.toLowerCase().includes('user already registered')) {
              throw new Error('already registered');
            }
            throw signUpError;
          }

          if (signUpData.user) {
            userId = signUpData.user.id;
            registroOk = true;
            // Guardar perfil
            await supabase.from('student_profiles').upsert({
              id: signUpData.user.id,
              full_name: name,
              birthday: birthday || null,
              education_level: education || null,
              education_other: educationOther || null,
              country: country || null,
              city: city || null,
              account_status: 'pending',
              onboarding_step: 'pending_plan',
            });
          }
        }

        if (!registroOk) throw new Error('No se pudo completar el registro');

        // Intento de login automático
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginError && loginData.user) {
          const displayName = loginData.user.user_metadata?.full_name || name || 'Estudiante';
          setSuccess(true);
          setTimeout(() => {
            onLogin(email, displayName, loginData.user!.id, false, country || undefined, city || undefined, true);
            onClose();
            setSuccess(false);
          }, 1200);
        } else {
          // Email pendiente de confirmación — mostrar mensaje claro
          setSuccess(true);
        }

      } else {
        // ── LOGIN (estudiante o admin) ──

        // SEGURIDAD: Si intentan acceder como admin, verificar ANTES de autenticar
        if (loginTab === 'admin') {
          // Solo el correo exacto del admin puede usar esta pestaña
          if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            setLoading(false);
            setError('❌ Acceso denegado. Este correo no está autorizado como administrador.');
            return;
          }
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        const displayName =
          data.user?.user_metadata?.full_name ||
          data.user?.email?.split('@')[0] ||
          'Usuario';

        if (loginTab === 'admin') {
          // Verificación: el email que pasó la autenticación debe coincidir con el admin
          // (ya se validó antes del login, pero doble check con el email real de Supabase)
          const confirmedEmail = data.user?.email?.trim().toLowerCase() ?? '';
          if (confirmedEmail !== ADMIN_EMAIL.toLowerCase()) {
            // No es admin — cerrar sesión y bloquear
            await supabase.auth.signOut();
            setLoading(false);
            setError('❌ Este usuario no tiene permisos de administrador.');
            return;
          }

          // ✅ Es admin confirmado por email
          setSuccess(true);
          setTimeout(() => {
            onLogin(email, displayName, data.user?.id, true);
            onClose();
            setSuccess(false);
          }, 900);
        } else {
          // ✅ Estudiante normal — nunca recibe isAdmin=true
          // SEGURIDAD EXTRA: Si el correo del admin intentó login como estudiante, bloquear
          if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            await supabase.auth.signOut();
            setLoading(false);
            setError('❌ Este correo es exclusivo para el panel de administración. Usa la pestaña "Administrador".');
            return;
          }
          setSuccess(true);
          setTimeout(() => {
            onLogin(email, displayName, data.user?.id, false);
            onClose();
            setSuccess(false);
          }, 900);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error';
      if (msg.includes('admin_email_reserved') || msg.includes('reservado para administradores')) {
        setError('❌ Este correo está reservado para administradores. No puede usarse para registrarse como estudiante.');
      } else if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already_registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate')) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const isAdminTab = loginTab === 'admin';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="h-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400" />
            <div className="p-6 md:p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10 w-auto mx-auto mb-4" />
              {success && isLogin ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {isAdminTab ? '¡Acceso Admin! 🛡️' : '¡Bienvenido de vuelta! 🎉'}
                    </h2>
                  </motion.div>
                ) : success && !isLogin ? (
                  /* REGISTRATION SUCCESS — Bienvenida + acceso inmediato */
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">¡Cuenta creada! 🎉</h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      Bienvenido/a a BLANG, <strong className="text-foreground">{name || email}</strong>. Tu cuenta está lista.
                    </p>
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 text-left mb-4">
                      <p className="text-sm text-foreground font-semibold mb-1">✅ Registro exitoso</p>
                      <p className="text-xs text-muted-foreground">Serás redirigido automáticamente a tu panel. Si no ocurre, cierra esta ventana e inicia sesión.</p>
                    </div>
                    <Button className="w-full rounded-xl" onClick={onClose}>
                      Ir a mi panel →
                    </Button>
                  </motion.div>
                ) : mode === 'forgot' ? (
                  <>
                    <h2 className="text-2xl font-bold text-foreground mb-1">¿Olvidaste tu contraseña? 🔑</h2>
                    <p className="text-muted-foreground text-sm">Te enviaremos un enlace para restablecerla</p>
                  </>
                ) : mode === 'forgot_sent' ? (
                  <>
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-foreground mb-1">¡Correo enviado! 📧</h2>
                    <p className="text-muted-foreground text-sm">Revisa tu bandeja de entrada y sigue el enlace para cambiar tu contraseña.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      {isLogin
                        ? (isAdminTab ? 'Panel de Administración 🛡️' : '¡Hola de nuevo! 👋')
                        : (regStep === 1 ? '¡Únete a BLANG! 🎉' : 'Cuéntanos sobre ti 📋')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {isLogin
                        ? (isAdminTab ? 'Acceso exclusivo para administradores' : 'Ingresa a tu cuenta para seguir aprendiendo')
                        : (regStep === 1 ? '7 días completamente gratis' : 'Paso 2 de 2 — Información personal (opcional)')}
                    </p>
                  </>
                )}
              </div>

              {/* ── TABS de login (estudiante / admin) ── */}
              {!success && isLogin && (
                <div className="flex rounded-2xl bg-muted p-1 mb-5 gap-1">
                  <button
                    type="button"
                    onClick={() => { setLoginTab('student'); setError(''); email && setEmail(email); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                      loginTab === 'student'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginTab('admin'); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                      loginTab === 'admin'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Administrador
                  </button>
                </div>
              )}

              {/* ── Aviso en pestaña admin: solo si email no coincide con el admin ── */}
              {!success && isLogin && isAdminTab && email && email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Solo el correo de administrador autorizado puede acceder aquí.
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {!success && isLogin && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">Correo electrónico 📧</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="tucorreo@ejemplo.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">Contraseña 🔒</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 rounded-xl"
                        required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setForgotEmail(email); }}
                      className="text-xs text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full rounded-xl py-6 text-base font-semibold ${
                      isAdminTab ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : isAdminTab ? '🛡️ Acceder al Panel Admin' : '¡Entrar a aprender! 🚀'}
                  </Button>
                  {isAdminTab && (
                    <p className="text-xs text-center text-muted-foreground">
                      🔒 Solo el administrador autorizado de BLANG puede acceder aquí
                    </p>
                  )}
                </form>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">Tu correo electrónico 📧</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="forgot-email" type="email" placeholder="tucorreo@ejemplo.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        className="pl-10 rounded-xl" required autoFocus />
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button type="submit" className="w-full rounded-xl py-6 text-base font-semibold" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : 'Enviar enlace de recuperación 📩'}
                  </Button>
                  <button type="button" onClick={() => { setMode('login'); setError(''); }}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                  </button>
                </form>
              )}

              {/* ── FORGOT SENT CONFIRMATION ── */}
              {mode === 'forgot_sent' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
                    <p className="font-semibold mb-1">✅ Correo enviado a:</p>
                    <p className="font-mono text-green-700">{forgotEmail}</p>
                    <p className="mt-2 text-green-700">Haz clic en el enlace del correo para crear una nueva contraseña. Puede tardar unos minutos en llegar.</p>
                    <p className="mt-1.5 text-xs text-green-600">💡 Revisa también tu carpeta de spam.</p>
                  </div>
                  <Button onClick={() => { setMode('login'); setError(''); }} className="w-full rounded-xl" variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al inicio de sesión
                  </Button>
                  <Button onClick={onClose} className="w-full rounded-xl">
                    Cerrar
                  </Button>
                </div>
              )}

              {/* ── REGISTER STEP 1: Basic info ── */}
              {!success && !isLogin && regStep === 1 && mode === 'register' && (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Tu nombre completo 😊</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" type="text" placeholder="¿Cómo te llamas?" value={name}
                        onChange={(e) => setName(e.target.value)} className="pl-10 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-sm font-medium">Correo electrónico 📧</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reg-email" type="email" placeholder="tucorreo@ejemplo.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-sm font-medium">Contraseña 🔒</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reg-password" type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 rounded-xl"
                        required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm-password" className="text-sm font-medium">Confirmar contraseña 🔒</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reg-confirm-password" type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite tu contraseña" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10 rounded-xl"
                        required minLength={6} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Inline mismatch hint */}
                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Las contraseñas no coinciden
                      </p>
                    )}
                    {confirmPassword.length > 0 && confirmPassword === password && (
                      <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" /> ¡Contraseñas coinciden!
                      </p>
                    )}
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button type="submit" className="w-full rounded-xl py-6 text-base font-semibold">
                    Siguiente →
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Al registrarte aceptas nuestros{' '}
                    <a href="#/terminos-de-servicio" className="text-primary hover:underline">Términos</a>{' '}
                    y{' '}
                    <a href="#/politica-de-privacidad" className="text-primary hover:underline">Privacidad</a>
                  </p>
                </form>
              )}

              {/* ── REGISTER STEP 2: Personal details ── */}
              {!success && !isLogin && regStep === 2 && mode === 'register' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Birthday */}
                  <div className="space-y-1.5">
                    <Label htmlFor="birthday" className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Fecha de nacimiento
                    </Label>
                    <Input id="birthday" type="date" value={birthday}
                      onChange={(e) => setBirthday(e.target.value)} className="rounded-xl"
                      max={new Date().toISOString().split('T')[0]} />
                  </div>

                  {/* Education */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Nivel de formación
                    </Label>
                    <div className="relative">
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecciona tu formación...</option>
                        {EDUCATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  {education === 'otro' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">¿Cuál es tu formación?</Label>
                      <Input placeholder="Describe tu formación..." value={educationOther}
                        onChange={(e) => setEducationOther(e.target.value)} className="rounded-xl" />
                    </div>
                  )}

                  {/* Country + City — searchable select + free text */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> País
                      </Label>
                      <SearchableSelect
                        value={country}
                        onChange={setCountry}
                        options={COUNTRIES_LIST}
                        placeholder="Selecciona..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Ciudad</Label>
                      <Input
                        placeholder="Ej: Bogotá"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setRegStep(1)}>
                      ← Atrás
                    </Button>
                    <Button type="submit" className="flex-1 rounded-xl py-6 text-base font-semibold" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creando cuenta...
                        </span>
                      ) : 'Crear cuenta 🎉'}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Campos opcionales — puedes completarlos después</p>
                </form>
              )}

              {!success && mode !== 'forgot' && mode !== 'forgot_sent' && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); setRegStep(1); }}
                    className="text-primary font-semibold hover:underline">
                    {isLogin ? '¡Regístrate gratis!' : 'Iniciar sesión'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}