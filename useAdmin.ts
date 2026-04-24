import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Email del administrador principal
const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

interface UseAdminReturn {
  isAdmin: boolean;
  loading: boolean;
  user: User | null;
}

/**
 * useAdmin — verifica si el usuario actual es administrador.
 * Usa onAuthStateChange como única fuente de verdad.
 * getSession() solo sirve para el estado inicial antes del primer evento.
 */
export function useAdmin(): UseAdminReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const mountedRef = useRef(true);

  const checkUser = useCallback(async (sessionUser: User | null) => {
    if (!mountedRef.current) return;

    if (!sessionUser) {
      setIsAdmin(false);
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(sessionUser);

    // Verificación 1: por email exacto — sin consulta a BD
    const userEmail = sessionUser.email?.trim().toLowerCase() ?? '';
    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Verificación 2: por tabla admin_users
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', sessionUser.id)
        .maybeSingle();
      if (mountedRef.current) {
        setIsAdmin(!!data);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setIsAdmin(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Escuchar cambios de auth — es la fuente principal
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    // Leer sesión inicial solo si onAuthStateChange no disparó todavía
    // Usamos un timeout pequeño para darle prioridad al evento de auth
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mountedRef.current) {
          checkUser(session?.user ?? null);
        }
      });
    }, 50);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [checkUser]);

  return { isAdmin, loading, user };
}

interface UseAdminAuthReturn {
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  loading: boolean;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setLoading(false);
        const msg = authError.message?.toLowerCase() ?? '';
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('fetch')) {
          return { error: 'Error de conexión. Verifica tu internet e intenta de nuevo.' };
        }
        return { error: 'Email o contraseña incorrectos. Verifica tus datos.' };
      }

      if (!data.session?.user) {
        setLoading(false);
        return { error: 'No se pudo iniciar sesión. Intenta de nuevo.' };
      }

      const confirmedEmail = data.session.user.email?.trim().toLowerCase() ?? '';
      const isAdminByEmail = confirmedEmail === ADMIN_EMAIL.toLowerCase();

      // Verificar también en admin_users si el email no coincide
      let isAdminByTable = false;
      if (!isAdminByEmail) {
        try {
          const { data: adminRow } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', data.session.user.id)
            .maybeSingle();
          isAdminByTable = !!adminRow;
        } catch {
          isAdminByTable = false;
        }
      }

      if (!isAdminByEmail && !isAdminByTable) {
        await supabase.auth.signOut();
        setLoading(false);
        return { error: 'Este usuario no tiene permisos de administrador.' };
      }

      setLoading(false);
      return { error: null };
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        return { error: 'Error de conexión. Verifica tu internet e intenta de nuevo.' };
      }
      return { error: msg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return { login, logout, loading };
}
