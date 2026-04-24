/**
 * adminWrite — Helper para operaciones de escritura del admin.
 * Usa la edge function 'admin-content-write' con service_role,
 * lo que bypasa RLS en todas las tablas.
 *
 * IMPORTANTE: usa fetch() directo porque supabase.functions.invoke()
 * sobreescribe el header Authorization y el token admin nunca llega.
 */
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EDGE_FN_URL     = `${SUPABASE_URL}/functions/v1/admin-content-write`;

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('No hay sesión activa. Por favor inicia sesión de nuevo.');
  return session.access_token;
}

async function callEdge(body: Record<string, unknown>): Promise<unknown> {
  const token = await getToken();

  const res = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  let payload: { data?: unknown; error?: unknown } = {};
  try {
    payload = await res.json();
  } catch {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Edge function error ${res.status}: ${text}`);
  }

  if (!res.ok || payload?.error) {
    const e = payload?.error;
    const msg = typeof e === 'string' ? e
      : (e && typeof e === 'object' && 'message' in e)
        ? (e as { message: string }).message
        : JSON.stringify(payload);
    throw new Error(`[${res.status}] ${msg}`);
  }

  return payload?.data;
}

// ── Operaciones básicas ─────────────────────────────────────────────────────

export async function adminInsert(
  table: string,
  data: Record<string, unknown> | Record<string, unknown>[]
) {
  return callEdge({ action: 'insert', table, data });
}

export async function adminUpdate(
  table: string,
  data: Record<string, unknown>,
  id?: string,
  filters?: Record<string, unknown>
) {
  return callEdge({ action: 'update', table, data, id, filters });
}

/**
 * adminUpsert — con soporte para onConflict explícito.
 * @param onConflict columna(s) de conflicto, ej: 'unit_id,stage'
 */
export async function adminUpsert(
  table: string,
  data: Record<string, unknown> | Record<string, unknown>[],
  onConflict?: string
) {
  return callEdge({ action: 'upsert', table, data, on_conflict: onConflict });
}

/**
 * adminReplace — Borra todas las filas que coinciden con `filters`
 * y luego inserta `data`. Ideal para guardar quizzes donde la clave
 * compuesta (unit_id, stage) puede ya existir.
 */
export async function adminReplace(
  table: string,
  filters: Record<string, unknown>,
  data: Record<string, unknown> | null
) {
  return callEdge({ action: 'replace', table, filters, data });
}

export async function adminDelete(table: string, id: string) {
  return callEdge({ action: 'delete', table, id });
}

export async function adminDeleteByFilter(
  table: string,
  filters: Record<string, unknown>
) {
  return callEdge({ action: 'delete', table, filters });
}

export async function adminSelect(
  table: string,
  options?: {
    select?: string;
    id?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  return callEdge({
    action: 'select',
    table,
    id: options?.id,
    filters: options?.filters,
    data: {
      select: options?.select ?? '*',
      order: options?.order,
      limit: options?.limit,
    },
  });
}
