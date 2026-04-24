
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get columns via pg_catalog
  const { data, error } = await supabase.rpc('get_table_columns' as never, {
    p_table: 'subscriptions'
  }).catch(() => ({ data: null, error: 'rpc not available' }));

  // Fallback: try a raw select to see what columns exist
  const { data: sample } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  // Get student_profiles columns too
  const { data: profSample } = await supabase
    .from('student_profiles')
    .select('*')
    .limit(1);

  return new Response(JSON.stringify({
    subscriptions_columns_from_rpc: data,
    rpc_error: error,
    subscriptions_sample: sample,
    student_profiles_sample: profSample,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
