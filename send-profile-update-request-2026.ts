import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { studentName, studentEmail, field, newValue, message } = await req.json()

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'no_api_key' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'blangenglishlearning@blangenglish.com'
    const domain = Deno.env.get('RESEND_DOMAIN')
    const from = domain ? `BLANG English <send@${domain}>` : 'BLANG English <onboarding@resend.dev>'

    const rdate = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

    const fieldLabels: Record<string, string> = {
      full_name: 'Nombre completo',
      phone: 'Teléfono / WhatsApp',
      country: 'País',
      city: 'Ciudad',
      birthday: 'Fecha de nacimiento',
      education_level: 'Nivel de educación',
      other: 'Otro',
    }

    const tr = (label: string, value: string) =>
      `<tr><td style="padding:8px 12px;background:#f5f3ff;font-weight:600;color:#37308a;border-right:2px solid #a78bfa;white-space:nowrap">${label}</td><td style="padding:8px 12px;color:#1f2a37">${value || '-'}</td></tr>`

    const html = `<!DOCTYPE html>
<div style="max-width:530px;margin:0 auto;font-family:sans-serif">
  <div style="background:#4f38ca;padding:24px;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">✏️ Solicitud de actualización de datos</h2>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Un estudiante quiere actualizar su información</p>
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">
    ${tr('Estudiante', studentName || '-')}
    ${tr('Correo', studentEmail || '-')}
    ${tr('Campo a cambiar', fieldLabels[field] || field || '-')}
    ${tr('Nuevo valor', newValue || '-')}
    ${tr('Mensaje adicional', message || '-')}
    ${tr('Fecha (Bogotá)', rdate)}
  </table>
  <div style="background:#f9f9fb;padding:16px;border-radius:0 0 12px 12px;font-size:12px;color:#666">
    <p>Actualiza el dato del estudiante desde el panel de administración: <strong>${studentEmail}</strong></p>
  </div>
</div>`

    // Intento 1: dominio propio
    const r1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: adminEmail, subject: `[BLANG] Solicitud actualización datos — ${studentName}`, html }),
    })

    if (r1.ok) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Intento 2: fallback onboarding@resend.dev
    const r2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'BLANG English <onboarding@resend.dev>', to: adminEmail, subject: `[BLANG] Solicitud actualización datos — ${studentName}`, html }),
    })

    const sent = r2.ok
    return new Response(JSON.stringify({ success: sent }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})