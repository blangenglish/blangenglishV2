import { useState } from 'react';
import { useNavigate, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CreditCard, Wallet, Settings, Menu, X, LogOut, Users, DollarSign, Globe } from 'lucide-react';
import { useAdmin, useAdminAuth } from '@/hooks/useAdmin';
import { ADMIN_ROUTES } from '@/lib/admin';
import { ROUTE_PATHS } from '@/lib/index';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading, user } = useAdmin();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-12 opacity-60" />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  }

  const navItems = [
    { to: ADMIN_ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { to: ADMIN_ROUTES.STUDENTS, icon: Users, label: 'Estudiantes' },
    { to: ADMIN_ROUTES.COURSES, icon: BookOpen, label: 'Cursos' },
    { to: ADMIN_ROUTES.REVENUE, icon: DollarSign, label: 'Ingresos' },
    { to: ADMIN_ROUTES.PRICING, icon: CreditCard, label: 'Precios' },
    { to: ADMIN_ROUTES.PAYMENTS, icon: Wallet, label: 'Pagos' },
    { to: ADMIN_ROUTES.SITE_EDITOR, icon: Globe, label: 'Editor del Sitio' },
    { to: ADMIN_ROUTES.SETTINGS, icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-8" />
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10" />
            <p className="text-xs text-muted-foreground mt-2">Panel de Administración</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <div className="px-3 py-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Admin</p>
              <p className="text-xs font-medium truncate text-foreground mt-0.5">
                {user?.email || 'admin@blang.com'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}