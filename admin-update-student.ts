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
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action, student_id, module_access } = body;

    // ─── list_all_students ───
    if (action === 'list_all_students') {
      const { data: profiles, error: profErr } = await admin
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profErr) {
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const studentIds = (profiles || []).map((p: { id: string }) => p.id);

      const { data: subs } = await admin
        .from('subscriptions')
        .select('*')
        .in('student_id', studentIds);

      const { data: progressRaw } = await admin
        .from('unit_progress')
        .select('student_id, course_slug, completed_units, total_units, streak_days, total_points')
        .in('student_id', studentIds);

      const { data: completions } = await admin
        .from('unit_completions')
        .select('student_id')
        .in('student_id', studentIds);

      const completionCounts: Record<string, number> = {};
      for (const c of (completions || [])) {
        completionCounts[c.student_id] = (completionCounts[c.student_id] || 0) + 1;
      }

      const students = (profiles || []).map((p: Record<string, unknown>) => {
        const studentSubs = (subs || []).filter((s: { student_id: string }) => s.student_id === p.id);
        const latestSub = studentSubs.length > 0 ? studentSubs[studentSubs.length - 1] : null;
        const studentProgress = (progressRaw || []).filter((pr: { student_id: string }) => pr.student_id === p.id);
        return {
          ...p,
          subscription: latestSub,
          progress: studentProgress,
          unit_completions_count: completionCounts[p.id as string] || 0,
        };
      });

      return new Response(JSON.stringify({ students }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── update_student ───
    if (action === 'update_student') {
      const results: Record<string, unknown> = {};

      // Update email in auth.users if provided
      if (body.new_email) {
        const { error: authErr } = await admin.auth.admin.updateUserById(student_id, {
          email: body.new_email,
        });
        if (authErr) {
          results.email_auth = authErr.message;
        } else {
          await admin.from('student_profiles').update({ email: body.new_email, updated_at: new Date().toISOString() }).eq('id', student_id);
          results.email_auth = 'ok';
        }
        return new Response(JSON.stringify({ success: !results.email_auth || results.email_auth === 'ok', results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update profile fields
      const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.new_full_name !== undefined) profileUpdate.full_name = body.new_full_name;
      if (body.new_phone !== undefined) profileUpdate.phone = body.new_phone;
      if (body.new_current_level !== undefined) profileUpdate.current_level = body.new_current_level;
      if (body.new_english_level !== undefined) profileUpdate.english_level = body.new_english_level;
      if (body.new_country !== undefined) profileUpdate.country = body.new_country;
      if (body.new_city !== undefined) profileUpdate.city = body.new_city;
      if (body.new_birthday !== undefined) profileUpdate.birthday = body.new_birthday;
      if (body.account_enabled !== undefined) profileUpdate.account_enabled = body.account_enabled;
      if (body.onboarding_step !== undefined) profileUpdate.onboarding_step = body.onboarding_step;

      // Derivar account_status correcto según account_enabled y sub_status
      if (body.account_enabled !== undefined) {
        const subStatus = body.sub_status || body.new_status;
        if (!body.account_enabled) {
          profileUpdate.account_status = 'disabled';
        } else if (subStatus === 'trial') {
          profileUpdate.account_status = 'active_trial';
        } else if (subStatus === 'cancelled') {
          profileUpdate.account_status = 'cancelled';
        } else {
          profileUpdate.account_status = 'active';
        }
      }

      const { error: profileErr } = await admin.from('student_profiles').update(profileUpdate).eq('id', student_id);

      // Update subscription status if provided
      const statusVal = body.new_status || body.sub_status;
      if (statusVal) {
        const subUpdate: Record<string, unknown> = {
          status: statusVal,
          updated_at: new Date().toISOString(),
        };
        if (body.account_enabled !== undefined) {
          subUpdate.account_enabled = body.account_enabled;
          subUpdate.approved_by_admin = body.account_enabled && statusVal === 'active';
        }
        await admin.from('subscriptions').update(subUpdate).eq('student_id', student_id);
      }

      return new Response(JSON.stringify({ success: !profileErr, error: profileErr?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── activate_plan ───
    if (action === 'activate_plan') {
      const {
        activation_date,
        amount_usd,
        payment_method,
        level,
        notes,
      } = body;

      const activationDate = activation_date ? new Date(activation_date) : new Date();
      const nextPeriodEnd = new Date(activationDate);
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      const isSpecificLevel = level && level !== 'Todas' && level !== 'Ninguna';
      const isNoLevel = level === 'Ninguna';
      const englishLevel = isSpecificLevel ? level : null;
      const onboardingStep = isNoLevel ? 'english_test' : 'completed';

      await admin.from('subscriptions').delete().eq('student_id', student_id);

      const { data: newSub, error: subErr } = await admin.from('subscriptions').insert({
        student_id,
        plan_slug: 'monthly',
        plan_name: 'Plan Mensual',
        status: 'active',
        amount_usd,
        payment_method,
        approved_by_admin: true,
        account_enabled: true,
        current_period_end: nextPeriodEnd.toISOString(),
        created_at: activationDate.toISOString(),
        trial_active: false,
      }).select().single();

      if (subErr) {
        return new Response(JSON.stringify({ success: false, error: subErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const profileUpd: Record<string, unknown> = {
        account_enabled: true,
        account_status: 'active',
        onboarding_step: onboardingStep,
        trial_active: false,
        updated_at: new Date().toISOString(),
      };
      if (englishLevel) profileUpd.english_level = englishLevel;
      if (isSpecificLevel) profileUpd.current_level = englishLevel;

      await admin.from('student_profiles').update(profileUpd).eq('id', student_id);

      if (!isNoLevel) {
        if (level === 'Todas') {
          const { data: allCourses } = await admin.from('courses').select('id').eq('is_published', true);
          if (allCourses) {
            for (const course of allCourses) {
              await admin.from('student_module_access').upsert({
                student_id, course_id: course.id, is_active: true, granted_at: new Date().toISOString(),
              }, { onConflict: 'student_id,course_id' });
            }
          }
        } else {
          const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
          const lvlIdx = LEVEL_ORDER.indexOf(level);
          const { data: levelCourses } = await admin.from('courses').select('id, level').eq('is_published', true);
          if (levelCourses) {
            for (const course of levelCourses) {
              const courseLvlIdx = LEVEL_ORDER.indexOf(course.level || '');
              const grant = courseLvlIdx >= 0 && courseLvlIdx <= lvlIdx;
              await admin.from('student_module_access').upsert({
                student_id, course_id: course.id, is_active: grant, granted_at: new Date().toISOString(),
              }, { onConflict: 'student_id,course_id' });
            }
          }
        }
      } else {
        await admin.from('student_module_access').update({ is_active: false }).eq('student_id', student_id);
      }

      await admin.from('payment_history').insert({
        student_id,
        event_type: 'payment_approved',
        amount_usd,
        payment_method,
        notes: notes || `Plan activado por admin - ${level === 'Todas' ? 'acceso completo' : level === 'Ninguna' ? 'examen pendiente' : 'nivel ' + level}`,
        created_by: 'admin',
      });

      return new Response(JSON.stringify({ success: true, subscription: newSub }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── approve_payment ───
    if (action === 'approve_payment') {
      await admin.from('subscriptions').update({
        approved_by_admin: true,
        account_enabled: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('student_id', student_id);

      await admin.from('student_profiles').update({
        account_enabled: true,
        account_status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── toggle_account_enabled ───
    if (action === 'toggle_account_enabled') {
      const { enabled } = body;
      await admin.from('subscriptions').update({
        account_enabled: enabled,
        approved_by_admin: enabled,
        updated_at: new Date().toISOString(),
      }).eq('student_id', student_id);

      await admin.from('student_profiles').update({
        account_enabled: enabled,
        account_status: enabled ? 'active' : 'disabled',
        updated_at: new Date().toISOString(),
      }).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── set_free_account ───
    if (action === 'set_free_account') {
      const { free } = body;
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 50);

      if (free) {
        await admin.from('subscriptions').delete().eq('student_id', student_id);
        await admin.from('subscriptions').insert({
          student_id, plan_slug: 'free_admin', plan_name: 'Acceso Gratuito (Admin)',
          status: 'active', amount_usd: 0, payment_method: 'none',
          approved_by_admin: true, account_enabled: true,
          current_period_end: farFuture.toISOString(),
        });
        await admin.from('student_profiles').update({
          account_enabled: true,
          account_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', student_id);
        // Grant all courses
        const { data: allCourses } = await admin.from('courses').select('id').eq('is_published', true);
        if (allCourses) {
          for (const course of allCourses) {
            await admin.from('student_module_access').upsert({
              student_id, course_id: course.id, is_active: true, granted_at: new Date().toISOString(),
            }, { onConflict: 'student_id,course_id' });
          }
        }
      } else {
        await admin.from('subscriptions').delete().eq('student_id', student_id);
        await admin.from('subscriptions').insert({
          student_id, plan_slug: 'monthly', plan_name: 'Plan Mensual',
          status: 'pending_approval', amount_usd: 15, payment_method: 'paypal',
          approved_by_admin: false, account_enabled: false,
        });
        await admin.from('student_profiles').update({
          account_enabled: false,
          account_status: 'disabled',
          updated_at: new Date().toISOString(),
        }).eq('id', student_id);
        await admin.from('student_module_access').update({ is_active: false }).eq('student_id', student_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── set_onboarding_step ───
    if (action === 'set_onboarding_step') {
      const { onboarding_step, english_level } = body;
      const profileUpd: Record<string, unknown> = {
        onboarding_step,
        updated_at: new Date().toISOString(),
      };
      if (english_level !== undefined) profileUpd.english_level = english_level;

      await admin.from('student_profiles').update(profileUpd).eq('id', student_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── delete_account ───
    if (action === 'delete_account') {
      await admin.from('payment_history').delete().eq('student_id', student_id);
      await admin.from('unit_completions').delete().eq('student_id', student_id);
      await admin.from('unit_progress').delete().eq('student_id', student_id);
      await admin.from('student_module_access').delete().eq('student_id', student_id);
      await admin.from('session_requests').delete().eq('student_id', student_id);
      await admin.from('subscriptions').delete().eq('student_id', student_id);
      await admin.from('student_profiles').delete().eq('id', student_id);

      const { error: authErr } = await admin.auth.admin.deleteUser(student_id);

      return new Response(JSON.stringify({ success: !authErr, error: authErr?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── module_access actions ───
    if (module_access) {
      const { action: maAction, course_id, unit_id } = module_access;

      if (maAction === 'grant_all_courses') {
        const { data: allCourses } = await admin.from('courses').select('id').eq('is_published', true);
        if (allCourses) {
          for (const course of allCourses) {
            await admin.from('student_module_access').upsert({
              student_id, course_id: course.id, is_active: true, granted_at: new Date().toISOString(),
            }, { onConflict: 'student_id,course_id' });
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (maAction === 'revoke_all_courses') {
        await admin.from('student_module_access').update({ is_active: false }).eq('student_id', student_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (maAction === 'grant' || maAction === 'revoke') {
        const isActive = maAction === 'grant';
        if (unit_id) {
          const { error: upsertErr } = await admin.from('student_module_access').upsert({
            student_id, course_id, unit_id, is_active: isActive, granted_at: new Date().toISOString(),
          }, { onConflict: 'student_id,course_id,unit_id' });
          if (upsertErr) {
            const { error: updErr } = await admin.from('student_module_access')
              .update({ is_active: isActive }).eq('student_id', student_id).eq('course_id', course_id).eq('unit_id', unit_id);
            if (updErr && isActive) {
              await admin.from('student_module_access').insert({ student_id, course_id, unit_id, is_active: true, granted_at: new Date().toISOString() });
            }
          }
        } else {
          const { error: upsertErr } = await admin.from('student_module_access').upsert({
            student_id, course_id, is_active: isActive, granted_at: new Date().toISOString(),
          }, { onConflict: 'student_id,course_id' });
          if (upsertErr) {
            const { error: updErr } = await admin.from('student_module_access')
              .update({ is_active: isActive }).eq('student_id', student_id).eq('course_id', course_id).is('unit_id', null);
            if (updErr && isActive) {
              await admin.from('student_module_access').insert({ student_id, course_id, is_active: true, granted_at: new Date().toISOString() });
            }
          }
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action: ' + action }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
