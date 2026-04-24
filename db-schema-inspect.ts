
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1) Columnas de student_profiles
  const { data: spCols } = await supabase.rpc('exec_sql', {
    query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='student_profiles' ORDER BY ordinal_position`
  }).catch(() => ({ data: null }));

  // Fallback: consultar directamente
  const { data: spSample, error: spErr } = await supabase
    .from('student_profiles')
    .select('*')
    .limit(2);

  const { data: subSample, error: subErr } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(2);

  // Columnas via pg_catalog
  const { data: pgSP } = await supabase
    .from('information_schema.columns' as never)
    .select('column_name,data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'student_profiles')
    .catch(() => ({ data: null }));

  const { data: pgSub } = await supabase
    .from('information_schema.columns' as never)
    .select('column_name,data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'subscriptions')
    .catch(() => ({ data: null }));

  return new Response(JSON.stringify({
    student_profiles_sample: spSample,
    student_profiles_error: spErr,
    subscriptions_sample: subSample,
    subscriptions_error: subErr,
    sp_cols: pgSP,
    sub_cols: pgSub,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
