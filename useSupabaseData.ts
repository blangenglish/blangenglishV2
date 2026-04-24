import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  DBCourse,
  DBUnit,
  DBMaterial,
  DBPricingPlan,
  DBSiteSettings,
} from '@/lib/admin';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCourses(): UseDataResult<DBCourse[]> {
  const [data, setData] = useState<DBCourse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: courses, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setData(courses || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch courses'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { data, loading, error, refetch: fetchCourses };
}

export function useUnits(courseId: string | null): UseDataResult<DBUnit[]> {
  const [data, setData] = useState<DBUnit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!courseId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data: units, error: fetchError } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setData(units || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch units'));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { data, loading, error, refetch: fetchUnits };
}

export function useMaterials(unitId: string | null): UseDataResult<DBMaterial[]> {
  const [data, setData] = useState<DBMaterial[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!unitId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data: materials, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('unit_id', unitId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setData(materials || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch materials'));
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return { data, loading, error, refetch: fetchMaterials };
}

export function usePricingPlans(): UseDataResult<DBPricingPlan[]> {
  const [data, setData] = useState<DBPricingPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: plans, error: fetchError } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setData(plans || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pricing plans'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { data, loading, error, refetch: fetchPlans };
}

export function useSiteSettings(): UseDataResult<Record<string, string>> {
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: settings, error: fetchError } = await supabase
        .from('site_settings')
        .select('*');

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, string> = {};
      if (settings) {
        settings.forEach((setting: DBSiteSettings) => {
          settingsMap[setting.key] = setting.value;
        });
      }
      setData(settingsMap);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch site settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { data, loading, error, refetch: fetchSettings };
}
