import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    if (action === 'save_subscription') {
      const { student_id, plan, method } = body;

      if (!student_id) {
        return new Response(JSON.stringify({ error: 'missing student_id' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const today = new Date();
      const trialEnd = new Date(today); trialEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);

      const isTrial = plan === 'trial';
      const isLater = plan === 'later';
      const isPaid = plan === 'discount' || plan === 'full';

      if (isLater) {
        await supabase.from('student_profiles').update({
          onboarding_step: 'pending_plan',
          account_enabled: false,
        }).eq('id', student_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const planName = plan === 'discount' ? 'Plan Mensual (50% OFF)' :
                       plan === 'full'     ? 'Plan Mensual' : '7 dias gratis';
      const amountUsd = plan === 'discount' ? 7.50 : plan === 'full' ? 15 : 0;

      const subData: Record<string, unknown> = {
        student_id,
        plan_slug: isPaid ? 'monthly' : 'free_trial',
        plan_name: planName,
        status: isTrial ? 'trial' : 'pending_approval',
        amount_usd: amountUsd,
        payment_method: method || 'none',
        approved_by_admin: isTrial ? true : false,
        account_enabled: isTrial ? true : false,
        current_period_end: isTrial ? trialEnd.toISOString() : monthEnd.toISOString(),
        trial_ends_at: isTrial ? trialEnd.toISOString() : null,
        renewal_due_at: isTrial ? trialEnd.toISOString() : monthEnd.toISOString(),
      };

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('student_id', student_id)
        .maybeSingle();

      let subError;
      if (existing?.id) {
        const { error } = await supabase.from('subscriptions').update(subData).eq('student_id', student_id);
        subError = error;
      } else {
        const { error } = await supabase.from('subscriptions').insert(subData);
        subError = error;
      }

      if (subError) {
        console.error('subscriptions error:', subError);
        return new Response(JSON.stringify({ error: subError.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const profileUpdate: Record<string, unknown> = {
        onboarding_step: 'pending_level',
        account_enabled: isTrial,
      };
      if (isTrial) {
        profileUpdate['account_status'] = 'trial';
      } else if (isPaid) {
        profileUpdate['account_status'] = 'pending';
      }

      await supabase.from('student_profiles').update(profileUpdate).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save_level') {
      const { student_id, level, source } = body;
      if (!student_id || !level) {
        return new Response(JSON.stringify({ error: 'missing fields' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('student_profiles').update({
        english_level: level,
        onboarding_step: 'completed',
      }).eq('id', student_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel_subscription') {
      const { student_id } = body;
      if (!student_id) {
        return new Response(JSON.stringify({ error: 'missing student_id' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('subscriptions').update({
        status: 'cancelled',
        account_enabled: false,
        approved_by_admin: false,
      }).eq('student_id', student_id);

      await supabase.from('student_profiles').update({
        account_enabled: false,
        account_status: 'disabled',
      }).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disable_expired_trial') {
      const { student_id } = body;
      if (!student_id) {
        return new Response(JSON.stringify({ error: 'missing student_id' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('subscriptions').update({
        status: 'cancelled',
        account_enabled: false,
      }).eq('student_id', student_id).eq('plan_slug', 'free_trial');

      await supabase.from('student_profiles').update({
        account_enabled: false,
        account_status: 'disabled',
      }).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown action: ' + action }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});