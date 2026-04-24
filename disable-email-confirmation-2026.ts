import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // List all users to diagnose
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const results = [];
    
    for (const user of users) {
      const needsConfirmation = !user.email_confirmed_at;
      
      if (needsConfirmation) {
        // Force confirm email
        const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        results.push({
          email: user.email,
          was_confirmed: false,
          now_confirmed: !updateError,
          error: updateError?.message,
        });
      } else {
        results.push({
          email: user.email,
          was_confirmed: true,
          now_confirmed: true,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_users: users.length,
      results,
    }), {
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
