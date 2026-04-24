
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

const ADMIN_EMAILS = [
  'blangenglishlearning@blangenglish.com',
  'blangenglishacademy@gmail.com',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ── 1. Token ────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // ── 2. Verificar usuario ────────────────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', detail: userErr?.message }), {
        status: 401, headers: corsHeaders,
      });
    }

    // ── 3. Verificar admin ──────────────────────────────────────────
    const userEmail = (user.email ?? '').trim().toLowerCase();
    const isAdminByEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

    let isAdminByFlag = false;
    if (!isAdminByEmail) {
      const { data: profile } = await adminClient
        .from('student_profiles')
        .select('is_admin_only')
        .eq('id', user.id)
        .single();
      isAdminByFlag = profile?.is_admin_only === true;
    }

    if (!isAdminByEmail && !isAdminByFlag) {
      return new Response(JSON.stringify({
        error: 'Access denied: not an admin',
        user_email: user.email,
      }), { status: 403, headers: corsHeaders });
    }

    // ── 4. Parsear body ─────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json();
    const { action, table, data, id, filters, on_conflict } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Q = any;

    function applyFilters(q: Q, flt: Record<string, unknown>): Q {
      let qq = q;
      for (const [k, v] of Object.entries(flt)) {
        if (v !== null && v !== undefined) qq = qq.eq(k, v);
      }
      return qq;
    }

    let result: { data: unknown; error: unknown } = { data: null, error: null };

    // ── INSERT ──────────────────────────────────────────────────────
    if (action === 'insert') {
      result = await adminClient.from(table).insert(data).select();

    // ── UPDATE ──────────────────────────────────────────────────────
    } else if (action === 'update') {
      let q = adminClient.from(table).update(data);
      if (id)      q = q.eq('id', id);
      if (filters) q = applyFilters(q, filters);
      result = await q.select();

    // ── UPSERT (con onConflict opcional) ────────────────────────────
    } else if (action === 'upsert') {
      const upsertOpts = on_conflict ? { onConflict: on_conflict } : undefined;
      result = upsertOpts
        ? await adminClient.from(table).upsert(data, upsertOpts).select()
        : await adminClient.from(table).upsert(data).select();

    // ── REPLACE: DELETE + INSERT en una transacción lógica ──────────
    // Ideal para quiz: borra todas las filas que coinciden con filters,
    // luego inserta el nuevo registro. Totalmente atómico desde el cliente.
    } else if (action === 'replace') {
      // 1. Borrar filas existentes
      let delQ = adminClient.from(table).delete();
      if (filters) {
        for (const [k, v] of Object.entries(filters as Record<string, unknown>)) {
          if (v !== null && v !== undefined) delQ = delQ.eq(k, v);
        }
      }
      const delResult = await delQ.select();
      if (delResult.error) {
        console.error(`[admin-content-write] replace/delete ${table}:`, delResult.error);
        return new Response(JSON.stringify({ error: delResult.error }), {
          status: 400, headers: corsHeaders,
        });
      }

      // 2. Insertar nuevo(s) registro(s) — solo si hay datos
      if (data !== null && data !== undefined) {
        result = await adminClient.from(table).insert(data).select();
      } else {
        result = { data: [], error: null };
      }

    // ── DELETE ──────────────────────────────────────────────────────
    } else if (action === 'delete') {
      let q = adminClient.from(table).delete();
      if (id) q = q.eq('id', id);
      if (filters) {
        for (const [k, v] of Object.entries(filters as Record<string, unknown>)) {
          if (v !== null && v !== undefined) q = q.eq(k, v);
        }
      }
      result = await q.select();

    // ── SELECT ──────────────────────────────────────────────────────
    } else if (action === 'select') {
      const d = (data ?? {}) as Record<string, unknown>;
      let q = adminClient.from(table).select((d.select as string) ?? '*');
      if (id)      q = q.eq('id', id);
      if (filters) q = applyFilters(q, filters);
      if (d.order) {
        const ord = d.order as { column: string; ascending?: boolean };
        q = q.order(ord.column, { ascending: ord.ascending ?? true });
      }
      if (d.limit) q = q.limit(d.limit as number);
      result = await q;

    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (result.error) {
      console.error(`[admin-content-write] ${action} ${table}:`, result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[admin-content-write] fatal:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: corsHeaders,
    });
  }
});
