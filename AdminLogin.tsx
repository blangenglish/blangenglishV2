import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '@/lib/admin';
import { IMAGES } from '@/assets/images';
import { useAdmin, useAdminAuth } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading } = useAdminAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Cuando useAdmin confirme isAdmin=true después del login, navegar al dashboard
  useEffect(() => {
    if (loginSuccess && !adminLoading && isAdmin) {
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    }
  }, [loginSuccess, adminLoading, isAdmin, navigate]);

  // Timeout de seguridad: si loginSuccess pero useAdmin tarda demasiado, navegar de todos modos
  useEffect(() => {
    if (!loginSuccess) return;
    const timer = setTimeout(() => {
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [loginSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error: loginError } = await login(email, password);

    if (loginError) {
      if (
        loginError.toLowerCase().includes('failed to fetch') ||
        loginError.toLowerCase().includes('networkerror') ||
        loginError.toLowerCase().includes('conexión')
      ) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        setError(loginError);
      }
      return;
    }

    // Login exitoso — navegar directo al dashboard
    navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    setLoginSuccess(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center mb-2">
            <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <CardDescription className="text-base">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@blang.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || loginSuccess}
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || loginSuccess}
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-2"
              disabled={loading || loginSuccess}
            >
              {loading || loginSuccess ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loginSuccess ? 'Entrando...' : 'Verificando...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Problemas para acceder? Contacta al soporte técnico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
