
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const result: Record<string, unknown> = {};

    // Insert a dummy subscription to see what columns exist, then delete
    // Actually, let's try inserting with known columns and catch the error to see schema
    // Better: use pg_typeof trick with a select that lists columns

    // Try select * with limit 0 to see column names from metadata
    const { data: subTest, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, student_id, plan_name, plan_slug, status, amount_usd, account_enabled, approved_by_admin, trial_ends_at, current_period_end, created_at, payment_method, renewal_due_at')
      .limit(0);

    result['subscriptions_col_test'] = { data: subTest, error: subErr?.message };

    // Test student_profiles columns
    const { data: profTest, error: profErr } = await supabase
      .from('student_profiles')
      .select('id, account_status, account_enabled, onboarding_step, created_at')
      .limit(0);

    result['student_profiles_col_test'] = { data: profTest, error: profErr?.message };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
