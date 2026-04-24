import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { email, password, name, birthday, education, education_other, country, city } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use service role to bypass email confirmation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const alreadyExists = existingUsers?.users?.some(u => u.email === email.toLowerCase().trim())
    if (alreadyExists) {
      return new Response(JSON.stringify({ error: 'already_registered' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user with email_confirm = true (no email verification needed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name || '' },
    })

    if (createError) {
      console.error('createUser error:', createError)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create student profile
    if (newUser?.user?.id) {
      await supabaseAdmin.from('student_profiles').upsert({
        id: newUser.user.id,
        full_name: name || '',
        birthday: birthday || null,
        education_level: education || null,
        education_other: education_other || null,
        country: country || null,
        city: city || null,
        account_status: 'pending',
        onboarding_step: 'pending_plan',
      })
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('register-student error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})