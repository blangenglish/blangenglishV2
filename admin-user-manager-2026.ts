import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, action } = body;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (action === 'list') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      return new Response(JSON.stringify({ 
        users: users?.map(u => ({ email: u.email, confirmed: !!u.email_confirmed_at, id: u.id })),
        error: error?.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'create' && email && password) {
      // Check if user exists
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const exists = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (exists) {
        // Update password and confirm email
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(exists.id, {
          password,
          email_confirm: true,
        });
        return new Response(JSON.stringify({ 
          success: !error, 
          action: 'updated',
          message: error ? error.message : `Usuario actualizado: ${email}`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        // Create new user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: email.split('@')[0] },
        });
        return new Response(JSON.stringify({ 
          success: !error, 
          action: 'created',
          message: error ? error.message : `Usuario creado: ${email}`,
          user_id: data?.user?.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    if (action === 'reset_password' && email && password) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'Usuario no encontrado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      });
      return new Response(JSON.stringify({ 
        success: !error, 
        message: error ? error.message : `Contraseña actualizada para: ${email}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Acción no válida. Usa: list, create, reset_password' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
