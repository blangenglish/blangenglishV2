import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_ROUTES } from '@/lib/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  TrendingUp,
  Package,
  Users,
  Star,
  DollarSign,
  Eye,
  ExternalLink,
  Clock,
  Gift,
} from 'lucide-react';
import { IMAGES } from '@/assets/images';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  current_level: string;
  created_at: string;
  sub_status?: string;
  sub_plan?: string;
}

interface RevenueData {
  month: string;
  usd: number;
  cop: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [freeAdminCount, setFreeAdminCount] = useState(0);
  const [revenueUSD, setRevenueUSD] = useState(0);
  const [revenueCOP, setRevenueCOP] = useState(0);
  const [publishedCourses, setPublishedCourses] = useState(0);
  const [recentStudents, setRecentStudents] = useState<StudentProfile[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueData[]>([]);

  // Verificar sesión al montar — si no hay sesión, redirigir al login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate(ADMIN_ROUTES.LOGIN, { replace: true });
      } else {
        setAuthChecked(true);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;
    const loadStats = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Usar edge function para saltar RLS y obtener datos reales
      const { data: edgeData } = await supabase.functions.invoke('admin-update-student', {
        body: { action: 'list_all_students' },
      });
      const allStudents: Array<{
        id: string; full_name: string; email: string; current_level: string; created_at: string;
        subscription?: { status: string; plan_slug: string; amount_usd: number; amount_cop: number; approved_by_admin: boolean; account_enabled: boolean; };
      }> = edgeData?.students || [];

      setStudentCount(allStudents.length);

      const subs = allStudents.map(s => s.subscription).filter(Boolean);
      const active = subs.filter(s => s!.status === 'active' && s!.plan_slug !== 'free_admin' && s!.account_enabled).length;
      const trial  = subs.filter(s => s!.status === 'trial').length;
      const pending = subs.filter(s => s!.approved_by_admin === false && s!.account_enabled === false && s!.status !== 'cancelled').length;
      const freeAdmin = subs.filter(s => s!.plan_slug === 'free_admin' && s!.status === 'active').length;
      setActiveCount(active);
      setTrialCount(trial);
      setPendingCount(pending);
      setFreeAdminCount(freeAdmin);

      const totalUSD = subs.reduce((a, s) => a + (Number(s!.amount_usd) || 0), 0);
      const totalCOP = subs.reduce((a, s) => a + (Number(s!.amount_cop) || 0), 0);
      setRevenueUSD(totalUSD);
      setRevenueCOP(totalCOP);

      // Cursos publicados
      const { data: courses } = await supabase.from('courses').select('is_published');
      setPublishedCourses(courses?.filter((c) => c.is_published).length || 0);

      // Actividad reciente: 5 estudiantes más nuevos con su email y estado de suscripción
      const recent = [...allStudents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map(s => ({
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          current_level: s.current_level,
          created_at: s.created_at,
          sub_status: s.subscription?.status,
          sub_plan: s.subscription?.plan_slug,
        }));
      setRecentStudents(recent);

      // Gráfico de ingresos: datos reales por mes
      const chartData: RevenueData[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('es-CO', { month: 'short' });
        const monthSubs = subs.filter(s => s!.plan_slug !== 'free_admin' && s!.status === 'active');
        const usd = monthSubs.reduce((a, s) => a + (Number(s!.amount_usd) || 0), 0);
        const cop = monthSubs.reduce((a, s) => a + (Number(s!.amount_cop) || 0), 0);
        chartData.push({ month: monthName, usd, cop });
      }
      setRevenueChart(chartData);
      } catch (err) {
        console.warn('Error cargando estadísticas del dashboard:', err);
      }
    };
    loadStats();
  }, [authChecked]);

  const stats = [
    {
      label: 'Total Estudiantes',
      value: studentCount,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Activos',
      value: activeCount,
      icon: Star,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'En Prueba',
      value: trialCount,
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Pendientes de Pago',
      value: pendingCount,
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Acceso Gratuito',
      value: freeAdminCount,
      icon: Gift,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Ingresos USD',
      value: `$${revenueUSD.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Ingresos COP',
      value: `$${revenueCOP.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Cursos Publicados',
      value: publishedCourses,
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  const quickActions = [
    {
      label: 'Estudiantes',
      desc: 'Gestionar estudiantes',
      icon: Users,
      route: ADMIN_ROUTES.STUDENTS,
      color: 'bg-primary hover:bg-primary/90',
    },
    {
      label: 'Cursos',
      desc: 'Gestionar cursos',
      icon: BookOpen,
      route: ADMIN_ROUTES.COURSES,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Ingresos',
      desc: 'Ver ingresos',
      icon: TrendingUp,
      route: ADMIN_ROUTES.REVENUE,
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10 w-auto" />
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                Admin
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground mt-1">Bienvenido · BLANG English Academy</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => window.open('/', '_blank')}
          >
            <Eye className="w-4 h-4" /> Ver sitio
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className={`${s.bg} border-border/50 rounded-2xl p-6 transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                  </div>
                  <div className={`${s.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => navigate(a.route)}
                  className={`${a.color} text-white rounded-2xl p-5 text-left transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <Icon className="w-7 h-7 mb-3" />
                  <p className="text-sm font-bold">{a.label}</p>
                  <p className="text-xs opacity-90 mt-1">{a.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 rounded-2xl border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Actividad Reciente
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs rounded-xl text-primary"
                onClick={() => navigate(ADMIN_ROUTES.STUDENTS)}
              >
                Ver todos <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            {recentStudents.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Aún no hay estudiantes registrados.
              </div>
            ) : (
              <div className="space-y-2">
                {recentStudents.map((s) => {
                  const isFree = s.sub_plan === 'free_admin' && s.sub_status === 'active';
                  const isTrial = s.sub_status === 'trial';
                  const isPending = !s.sub_status || (s.sub_status !== 'active' && s.sub_status !== 'trial' && s.sub_status !== 'cancelled');
                  const isCancelled = s.sub_status === 'cancelled';
                  const isActive = s.sub_status === 'active' && s.sub_plan !== 'free_admin';
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors border border-border/30"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {s.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          Se inscribió el {new Date(s.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          {s.current_level || 'A1'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isFree ? 'bg-violet-100 text-violet-700' :
                          isActive ? 'bg-green-100 text-green-700' :
                          isTrial ? 'bg-blue-100 text-blue-700' :
                          isCancelled ? 'bg-red-100 text-red-600' :
                          isPending ? 'bg-amber-100 text-amber-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isFree ? '🎁 Gratuito' : isActive ? '✅ Activo' : isTrial ? '🌱 Prueba' : isCancelled ? '❌ Cancelado' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-2xl border-border/50 shadow-sm">
            <h2 className="font-bold text-base mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Ingresos (Últimos 6 Meses)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="usd" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
