import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSiteSettings } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { SiPaypal } from 'react-icons/si';

export default function AdminPayments() {
  const { data: settings, loading: settingsLoading, refetch } = useSiteSettings();

  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalSaving, setPaypalSaving] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setPaypalEmail(settings.paypal_email || '');
    }
  }, [settings]);

  const handlePaypalSave = async () => {
    setPaypalSaving(true);
    setError(null);
    setPaypalSuccess(false);
    try {
      const { error: upsertError } = await supabase
        .from('site_settings')
        .upsert({ key: 'paypal_email', value: paypalEmail }, { onConflict: 'key' });
      if (upsertError) throw upsertError;
      setPaypalSuccess(true);
      await refetch();
      setTimeout(() => setPaypalSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar PayPal');
    } finally {
      setPaypalSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando configuración de pagos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Pagos</h1>
          <p className="text-muted-foreground mt-2">
            Configura los métodos de pago disponibles para los estudiantes
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ── PayPal (activo) ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                  <SiPaypal className="w-6 h-6 text-[#003087]" />
                </div>
                <div>
                  <CardTitle>PayPal</CardTitle>
                  <CardDescription>Pagos internacionales en USD</CardDescription>
                </div>
                <span className="ml-auto text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  ✅ Activo
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="paypal-email">Email de PayPal</Label>
                <Input
                  id="paypal-email"
                  type="email"
                  placeholder="tu-email@paypal.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Los estudiantes enviarán pagos a este email de PayPal
                </p>
              </div>

              <Button
                onClick={handlePaypalSave}
                disabled={paypalSaving || !paypalEmail}
                className="w-full"
              >
                {paypalSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : paypalSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Guardado ✅
                  </>
                ) : (
                  'Guardar PayPal'
                )}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Vista previa para estudiantes:</p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <SiPaypal className="w-5 h-5 text-[#003087]" />
                    <span className="font-medium">PayPal</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Envía tu pago a:</p>
                  <p className="text-sm font-mono bg-background px-3 py-2 rounded border">
                    {paypalEmail || 'tu-email@paypal.com'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── PSE (próximamente, deshabilitado) ── */}
          <Card className="opacity-60 relative overflow-hidden">
            {/* Overlay deshabilitado */}
            <div className="absolute inset-0 bg-muted/30 z-10 flex items-center justify-center rounded-lg">
              <div className="bg-background border border-border rounded-xl px-5 py-3 flex items-center gap-2 shadow-md">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground">Próximamente</span>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>PSE</CardTitle>
                  <CardDescription>Pagos en Colombia (COP)</CardDescription>
                </div>
                <span className="ml-auto text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  🔒 No disponible
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input disabled placeholder="Nombre del banco" />
              </div>
              <div className="space-y-2">
                <Label>Número de cuenta</Label>
                <Input disabled placeholder="Número de cuenta" />
              </div>
              <div className="space-y-2">
                <Label>Titular</Label>
                <Input disabled placeholder="Nombre del titular" />
              </div>
              <Button disabled className="w-full">Guardar PSE</Button>
            </CardContent>
          </Card>
        </div>

        {/* Instrucciones */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SiPaypal className="w-5 h-5" />
              Instrucciones para estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">Proceso de pago (PayPal):</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>El estudiante selecciona un plan de suscripción</li>
                  <li>Se muestra el email de PayPal para enviar el pago</li>
                  <li>El estudiante realiza el pago y envía el comprobante</li>
                  <li>El admin verifica y activa la suscripción manualmente aquí</li>
                </ol>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Revisa regularmente los comprobantes de pago y activa las suscripciones de forma oportuna para mantener una buena experiencia del estudiante.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
