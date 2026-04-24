
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

  const result: Record<string, unknown> = {};

  // student_profiles
  try {
    const { data, error } = await supabase.from('student_profiles').select('*').limit(3);
    result['student_profiles'] = { data, error: error?.message };
  } catch(e) { result['student_profiles'] = { error: String(e) }; }

  // subscriptions
  try {
    const { data, error } = await supabase.from('subscriptions').select('*').limit(3);
    result['subscriptions'] = { data, error: error?.message };
  } catch(e) { result['subscriptions'] = { error: String(e) }; }

  // payment_receipts
  try {
    const { data, error } = await supabase.from('payment_receipts').select('*').limit(3);
    result['payment_receipts'] = { data, error: error?.message };
  } catch(e) { result['payment_receipts'] = { error: String(e) }; }

  // auth users count
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    result['auth_users'] = { count: data?.users?.length, users: data?.users?.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })), error: error?.message };
  } catch(e) { result['auth_users'] = { error: String(e) }; }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
