import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

async function sendWithResend(resendKey: string, from: string, to: string, subject: string, html: string, logs: string[]) {
  const r1 = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  const t1 = await r1.text()
  logs.push('[ATTEMPT1] from=' + from + ' status=' + r1.status + ' resp=' + t1.substring(0, 200))

  if (r1.ok) {
    const j = JSON.parse(t1)
    return { ok: true, id: j.id }
  }

  const fallbackFrom = 'BLANG English <onboarding@resend.dev>'
  logs.push('[RETRY] retrying with fallback from=' + fallbackFrom)

  const r2 = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fallbackFrom, to, subject, html }),
  })
  const t2 = await r2.text()
  logs.push('[ATTEMPT2] status=' + r2.status + ' resp=' + t2.substring(0, 200))

  if (r2.ok) {
    const j = JSON.parse(t2)
    return { ok: true, id: j.id, fallback: true }
  }

  return { ok: false, error: 'Both attempts failed. Last: ' + t2.substring(0, 100) }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const logs: string[] = []

  try {
    const { userName, userEmail, message, requestType } = await req.json()
    logs.push('[START] type=' + requestType + ' email=' + userEmail)

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      logs.push('[WARN] RESEND_API_KEY not configured - skipping email')
      return new Response(JSON.stringify({ success: false, skipped: true, logs }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'blangenglishlearning@blangenglish.com'
    const domain = Deno.env.get('RESEND_DOMAIN')
    const primaryFrom = domain ? 'BLANG English <send@' + domain + '>' : 'BLANG English <onboarding@resend.dev>'

    const subjectMap: Record<string, string> = {
      trial_request: '[BLANG] Solicitud 7 Dias Gratis',
      discount_request: '[BLANG] Solicitud Descuento 50%',
      payment_request: '[BLANG] Solicitud Plan Completo',
    }
    const subject = subjectMap[requestType] || '[BLANG] Nueva Solicitud'

    const rdate = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
    const tr = (label: string, value: string) =>
      '<tr><td style="padding:8px 12px;background:#f5f3ff;font-weight:600;color:#37308a;border-right:2px solid #a78bfa;white-space:nowrap">'
      + label + '</td><td style="padding:8px 12px;color:#1f2a37">' + (value || '-') + '</td></tr>'

    const html = '<!DOCTYPE html><style>body{margin:0;padding:0;font-family:sans-serif}</style>'
      + '<div style="max-width:530px;margin:0 auto;font-family:sans-serif">'
      + '<div style="background:#4f38ca;padding:24px;border-radius:12px 12px 0 0">'
      + '<h2 style="color:#fff;margin:0;font-size:18px">Nueva Solicitud - BLANG English</h2>'
      + '<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Un estudiante envio una solicitud</p></div>'
      + '<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">'
      + tr('Nombre', userName || '-')
      + tr('Correo estudiante', userEmail || '-')
      + tr('Tipo solicitud', requestType || '-')
      + tr('Mensaje', message || '-')
      + tr('Fecha (Bogota)', rdate)
      + '</table>'
      + '<div style="background:#f9f9fb;padding:16px;border-radius:0 0 12px 12px;font-size:12px;color:#666">'
      + '<p><b>Responde</b> a este correo o contacta al estudiante en su correo arriba.</p></div>'
      + '</div>'

    const result = await sendWithResend(resendKey, primaryFrom, adminEmail, subject, html, logs)

    return new Response(JSON.stringify({ success: result.ok, ...result, logs }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[FATAL]', String(err))
    logs.push('[FATAL] ' + String(err))
    return new Response(JSON.stringify({ success: false, error: String(err), logs }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})