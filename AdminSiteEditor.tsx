import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Globe } from 'lucide-react'

interface SiteSettings {
  hero_title: string
  hero_subtitle: string
  hero_cta_text: string
  about_text: string
  methodology_text: string
  pricing_note: string
  footer_email: string
  footer_phone: string
  footer_whatsapp: string
  social_instagram: string
  social_tiktok: string
  social_whatsapp_channel: string
  announcement_text: string
  announcement_visible: string
}

export default function AdminSiteEditor() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [settings, setSettings] = useState<SiteSettings>({
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: '',
    about_text: '',
    methodology_text: '',
    pricing_note: '',
    footer_email: '',
    footer_phone: '',
    footer_whatsapp: '',
    social_instagram: '',
    social_tiktok: '',
    social_whatsapp_channel: '',
    announcement_text: '',
    announcement_visible: 'false',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')

      if (error) throw error

      if (data) {
        const settingsMap: Partial<SiteSettings> = {}
        data.forEach((item) => {
          settingsMap[item.key as keyof SiteSettings] = item.value
        })
        setSettings((prev) => ({ ...prev, ...settingsMap }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (keys: (keyof SiteSettings)[]) => {
    try {
      setSaving(keys[0])
      const updates = keys.map((key) => ({
        key,
        value: settings[key],
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update, { onConflict: 'key' })

        if (error) throw error
      }

      toast({
        title: 'Guardado',
        description: 'Los cambios se guardaron correctamente',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      })
    } finally {
      setSaving(null)
    }
  }

  const updateSetting = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Editor del Sitio</h1>
            <p className="text-muted-foreground">
              Edita el contenido visible de la página web
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sección Hero</CardTitle>
            <CardDescription>
              Título principal, subtítulo y texto del botón de llamada a la acción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_title">Título Principal</Label>
              <Input
                id="hero_title"
                value={settings.hero_title}
                onChange={(e) => updateSetting('hero_title', e.target.value)}
                placeholder="Aprende Inglés con BLANG"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Subtítulo</Label>
              <Textarea
                id="hero_subtitle"
                value={settings.hero_subtitle}
                onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                placeholder="Clases en vivo, ejercicios interactivos y más"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_cta_text">Texto del Botón CTA</Label>
              <Input
                id="hero_cta_text"
                value={settings.hero_cta_text}
                onChange={(e) => updateSetting('hero_cta_text', e.target.value)}
                placeholder="Comenzar Ahora"
              />
            </div>
            <Button
              onClick={() => saveSection(['hero_title', 'hero_subtitle', 'hero_cta_text'])}
              disabled={saving === 'hero_title'}
            >
              {saving === 'hero_title' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Hero
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sección Acerca de / Metodología</CardTitle>
            <CardDescription>
              Texto descriptivo sobre la academia y el método de enseñanza
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="about_text">Texto Acerca de</Label>
              <Textarea
                id="about_text"
                value={settings.about_text}
                onChange={(e) => updateSetting('about_text', e.target.value)}
                placeholder="BLANG English Academy es..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="methodology_text">Texto Metodología</Label>
              <Textarea
                id="methodology_text"
                value={settings.methodology_text}
                onChange={(e) => updateSetting('methodology_text', e.target.value)}
                placeholder="Nuestra metodología se basa en..."
                rows={4}
              />
            </div>
            <Button
              onClick={() => saveSection(['about_text', 'methodology_text'])}
              disabled={saving === 'about_text'}
            >
              {saving === 'about_text' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Acerca de
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sección Precios</CardTitle>
            <CardDescription>
              Nota adicional que aparece en la sección de precios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_note">Nota de Precios</Label>
              <Textarea
                id="pricing_note"
                value={settings.pricing_note}
                onChange={(e) => updateSetting('pricing_note', e.target.value)}
                placeholder="Todos los planes incluyen acceso completo..."
                rows={3}
              />
            </div>
            <Button
              onClick={() => saveSection(['pricing_note'])}
              disabled={saving === 'pricing_note'}
            >
              {saving === 'pricing_note' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Nota
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto (Footer)</CardTitle>
            <CardDescription>
              Email, teléfono y WhatsApp que aparecen en el pie de página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer_email">Email</Label>
              <Input
                id="footer_email"
                type="email"
                value={settings.footer_email}
                onChange={(e) => updateSetting('footer_email', e.target.value)}
                placeholder="contacto@blang.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_phone">Teléfono</Label>
              <Input
                id="footer_phone"
                value={settings.footer_phone}
                onChange={(e) => updateSetting('footer_phone', e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer_whatsapp">WhatsApp</Label>
              <Input
                id="footer_whatsapp"
                value={settings.footer_whatsapp}
                onChange={(e) => updateSetting('footer_whatsapp', e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            <Button
              onClick={() =>
                saveSection(['footer_email', 'footer_phone', 'footer_whatsapp'])
              }
              disabled={saving === 'footer_email'}
            >
              {saving === 'footer_email' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Contacto
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
            <CardDescription>
              URLs de Instagram, TikTok y canal de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="social_instagram">Instagram URL</Label>
              <Input
                id="social_instagram"
                value={settings.social_instagram}
                onChange={(e) => updateSetting('social_instagram', e.target.value)}
                placeholder="https://instagram.com/blang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_tiktok">TikTok URL</Label>
              <Input
                id="social_tiktok"
                value={settings.social_tiktok}
                onChange={(e) => updateSetting('social_tiktok', e.target.value)}
                placeholder="https://tiktok.com/@blang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_whatsapp_channel">Canal de WhatsApp URL</Label>
              <Input
                id="social_whatsapp_channel"
                value={settings.social_whatsapp_channel}
                onChange={(e) =>
                  updateSetting('social_whatsapp_channel', e.target.value)
                }
                placeholder="https://whatsapp.com/channel/..."
              />
            </div>
            <Button
              onClick={() =>
                saveSection([
                  'social_instagram',
                  'social_tiktok',
                  'social_whatsapp_channel',
                ])
              }
              disabled={saving === 'social_instagram'}
            >
              {saving === 'social_instagram' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Redes Sociales
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banner de Anuncios</CardTitle>
            <CardDescription>
              Mensaje destacado que aparece en la parte superior del sitio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement_text">Texto del Anuncio</Label>
              <Textarea
                id="announcement_text"
                value={settings.announcement_text}
                onChange={(e) => updateSetting('announcement_text', e.target.value)}
                placeholder="¡Oferta especial! 20% de descuento en planes anuales"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="announcement_visible"
                checked={settings.announcement_visible === 'true'}
                onCheckedChange={(checked) =>
                  updateSetting('announcement_visible', checked ? 'true' : 'false')
                }
              />
              <Label htmlFor="announcement_visible">Mostrar Banner</Label>
            </div>
            <Button
              onClick={() =>
                saveSection(['announcement_text', 'announcement_visible'])
              }
              disabled={saving === 'announcement_text'}
            >
              {saving === 'announcement_text' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Anuncio
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}