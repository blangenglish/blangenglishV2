import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { IMAGES } from '@/assets/images';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase handles the token from the URL hash automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate(ROUTE_PATHS.HOME), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-background rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400" />
          <div className="p-8">
            <div className="text-center mb-8">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10 w-auto mx-auto mb-4" />
              {success ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold">¡Contraseña actualizada! ✅</h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    Redirigiendo al inicio en unos segundos...
                  </p>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-1">Crear nueva contraseña 🔐</h2>
                  <p className="text-muted-foreground text-sm">
                    {sessionReady
                      ? 'Ingresa y confirma tu nueva contraseña'
                      : 'Procesando enlace de recuperación...'}
                  </p>
                </>
              )}
            </div>

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-xl"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="pl-10 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Strength hints */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    {[
                      { check: password.length >= 6, label: 'Mínimo 6 caracteres' },
                      { check: /[A-Z]/.test(password), label: 'Al menos una mayúscula' },
                      { check: /[0-9]/.test(password), label: 'Al menos un número' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-1.5 text-xs ${item.check ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className={`w-3.5 h-3.5 ${item.check ? 'opacity-100' : 'opacity-30'}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl py-6 text-base font-semibold"
                  disabled={loading || !sessionReady}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : '✅ Guardar nueva contraseña'}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTE_PATHS.HOME)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Cancelar y volver al inicio
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
