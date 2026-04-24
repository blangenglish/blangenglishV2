import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSiteSettings } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Eye, Globe, DollarSign, Mail, Instagram, Facebook, Music, Youtube, CreditCard, Wallet, Building2, ExternalLink } from 'lucide-react';

export default function AdminSettings() {
  const { data: settings, loading, refetch } = useSiteSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCtaPrimary, setHeroCtaPrimary] = useState('');

  const [trialDays, setTrialDays] = useState('');
  const [launchDiscountPct, setLaunchDiscountPct] = useState('');

  const [contactEmail, setContactEmail] = useState('');

  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Payment config
  const [paypalLink, setPaypalLink] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [pseBankName, setPseBankName] = useState('');
  const [pseAccountType, setPseAccountType] = useState('Ahorros');
  const [pseAccountNumber, setPseAccountNumber] = useState('');
  const [pseOwnerName, setPseOwnerName] = useState('');
  const [pseOwnerId, setPseOwnerId] = useState('');
  const [payConfigLoading, setPayConfigLoading] = useState(true);

  useEffect(() => {
    if (settings) {
      setHeroTitle(settings.hero_title || '');
      setHeroSubtitle(settings.hero_subtitle || '');
      setHeroCtaPrimary(settings.hero_cta_primary || '');
      setTrialDays(settings.trial_days || '');
      setLaunchDiscountPct(settings.launch_discount_pct || '');
      setContactEmail(settings.contact_email || '');
      setInstagramUrl(settings.instagram_url || '');
      setFacebookUrl(settings.facebook_url || '');
      setTiktokUrl(settings.tiktok_url || '');
      setYoutubeUrl(settings.youtube_url || '');
    }
  }, [settings]);

  // Load payment config
  useEffect(() => {
    supabase.from('payment_config').select('key, value').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value || ''; });
        setPaypalLink(map['paypal_link'] || '');
        setPaypalEmail(map['paypal_email'] || '');
        setPseBankName(map['pse_bank_name'] || '');
        setPseAccountType(map['pse_account_type'] || 'Ahorros');
        setPseAccountNumber(map['pse_account_number'] || '');
        setPseOwnerName(map['pse_owner_name'] || '');
        setPseOwnerId(map['pse_owner_id'] || '');
      }
      setPayConfigLoading(false);
    });
  }, []);

  const upsertPayConfig = async (updates: Record<string, string>) => {
    const promises = Object.entries(updates).map(([key, value]) =>
      supabase.from('payment_config').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw new Error('Error guardando configuración de pagos');
  };

  const handleSavePayments = async () => {
    setSaving('payments');
    try {
      await upsertPayConfig({
        paypal_link: paypalLink,
        paypal_email: paypalEmail,
        pse_bank_name: pseBankName,
        pse_account_type: pseAccountType,
        pse_account_number: pseAccountNumber,
        pse_owner_name: pseOwnerName,
        pse_owner_id: pseOwnerId,
      });
      toast({ title: '✅ Pagos guardados', description: 'Configuración de pagos actualizada correctamente.' });
    } catch {
      toast({ title: '❌ Error', description: 'No se pudo guardar la configuración de pagos.', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const upsertSettings = async (updates: Record<string, string>) => {
    const promises = Object.entries(updates).map(([key, value]) =>
      supabase
        .from('site_settings')
        .upsert({ key, value }, { onConflict: 'key' })
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      throw new Error('Failed to save some settings');
    }
  };

  const handleSaveHero = async () => {
    setSaving('hero');
    try {
      await upsertSettings({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_cta_primary: heroCtaPrimary,
      });
      await refetch();
      toast({
        title: '✅ Hero guardado',
        description: 'Los cambios del hero se guardaron correctamente.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar el hero.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSavePricing = async () => {
    setSaving('pricing');
    try {
      await upsertSettings({
        trial_days: trialDays,
        launch_discount_pct: launchDiscountPct,
      });
      await refetch();
      toast({
        title: '✅ Precios guardados',
        description: 'La configuración de precios se guardó correctamente.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar la configuración de precios.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving('general');
    try {
      await upsertSettings({
        contact_email: contactEmail,
      });
      await refetch();
      toast({
        title: '✅ General guardado',
        description: 'La configuración general se guardó correctamente.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar la configuración general.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSocial = async () => {
    setSaving('social');
    try {
      await upsertSettings({
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        tiktok_url: tiktokUrl,
        youtube_url: youtubeUrl,
      });
      await refetch();
      toast({
        title: '✅ Redes sociales guardadas',
        description: 'Los enlaces de redes sociales se guardaron correctamente.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo guardar las redes sociales.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚙️ Configuración del Sitio</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza el contenido y la configuración de tu plataforma BLANG.
          </p>
        </div>

        <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
          <Eye className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Vista previa en vivo</p>
            <p className="text-sm text-muted-foreground">
              Los cambios se reflejarán en el sitio público después de guardar.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Hero Principal
            </CardTitle>
            <CardDescription>
              Edita el título, subtítulo y texto del botón principal del hero.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Título del Hero</Label>
              <Input
                id="hero-title"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Aprende inglés de forma efectiva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Subtítulo del Hero</Label>
              <Input
                id="hero-subtitle"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Clases en vivo, lecciones interactivas y más"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-cta">Texto del Botón Principal</Label>
              <Input
                id="hero-cta"
                value={heroCtaPrimary}
                onChange={(e) => setHeroCtaPrimary(e.target.value)}
                placeholder="Comienza Ahora"
              />
            </div>
            <Button
              onClick={handleSaveHero}
              disabled={saving === 'hero'}
              className="w-full sm:w-auto"
            >
              {saving === 'hero' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Hero
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Configuración de Precios
            </CardTitle>
            <CardDescription>
              Ajusta los días de prueba y el descuento de lanzamiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trial-days">Días de Prueba Gratis</Label>
                <Input
                  id="trial-days"
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  placeholder="7"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-pct">Descuento de Lanzamiento (%)</Label>
                <Input
                  id="discount-pct"
                  type="number"
                  value={launchDiscountPct}
                  onChange={(e) => setLaunchDiscountPct(e.target.value)}
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <Button
              onClick={handleSavePricing}
              disabled={saving === 'pricing'}
              className="w-full sm:w-auto"
            >
              {saving === 'pricing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Precios
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Email de contacto y otras configuraciones generales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email de Contacto</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@blang.com"
              />
            </div>
            <Button
              onClick={handleSaveGeneral}
              disabled={saving === 'general'}
              className="w-full sm:w-auto"
            >
              {saving === 'general' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar General
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              Redes Sociales
            </CardTitle>
            <CardDescription>
              Enlaces a tus perfiles de redes sociales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/blang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/blang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                TikTok
              </Label>
              <Input
                id="tiktok"
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@blang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                YouTube
              </Label>
              <Input
                id="youtube"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@blang"
              />
            </div>
            <Button
              onClick={handleSaveSocial}
              disabled={saving === 'social'}
              className="w-full sm:w-auto"
            >
              {saving === 'social' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Redes Sociales
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── PAYMENT CONFIG ── */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Configuración de Pagos
            </CardTitle>
            <CardDescription>
              Configura los métodos de pago manual: PayPal y PSE / Transferencia bancaria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {payConfigLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
            ) : (
              <>
                {/* PayPal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-blue-700">
                    <Wallet className="w-4 h-4" /> PayPal
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Enlace PayPal.me</Label>
                      <Input value={paypalLink} onChange={e => setPaypalLink(e.target.value)} placeholder="https://paypal.me/tuusuario" />
                      {paypalLink && <a href={paypalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" />Ver enlace</a>}
                    </div>
                    <div className="space-y-2">
                      <Label>Correo PayPal</Label>
                      <Input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="tucuenta@paypal.com" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <Building2 className="w-4 h-4" /> PSE / Transferencia Bancaria
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del banco</Label>
                      <Input value={pseBankName} onChange={e => setPseBankName(e.target.value)} placeholder="Davivienda, Nequi, Daviplata, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de cuenta</Label>
                      <select value={pseAccountType} onChange={e => setPseAccountType(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de cuenta</Label>
                      <Input value={pseAccountNumber} onChange={e => setPseAccountNumber(e.target.value)} placeholder="123456789" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre del titular</Label>
                      <Input value={pseOwnerName} onChange={e => setPseOwnerName(e.target.value)} placeholder="Nombre completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula / NIT del titular</Label>
                      <Input value={pseOwnerId} onChange={e => setPseOwnerId(e.target.value)} placeholder="1234567890" />
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">⚠️ Esta información se mostrará a los estudiantes en el flujo de pago. Asegúrate de que sea correcta antes de guardar.</p>
                  </div>
                </div>

                <Button onClick={handleSavePayments} disabled={saving === 'payments'} className="w-full sm:w-auto">
                  {saving === 'payments' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Configuración de Pagos</>}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}