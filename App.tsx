import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import { ADMIN_ROUTES } from '@/lib/admin';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import Home from '@/pages/Home';
import Lessons from '@/pages/Lessons';
import LiveClasses from '@/pages/LiveClasses';
// Progress page removed
import Dashboard from '@/pages/Dashboard';
import PricingPage from '@/pages/Pricing';
import Methodology from '@/pages/Methodology';
import FAQ from '@/pages/FAQ';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import ResetPassword from '@/pages/ResetPassword';
import { AuthModals } from '@/components/AuthModals';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminStudents from '@/pages/admin/AdminStudents';
import AdminRevenue from '@/pages/admin/AdminRevenue';

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userCountry, setUserCountry] = useState('');
  const [userCity, setUserCity] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

  const isAdminRoute = location.pathname.startsWith('/adminblang');

  useEffect(() => {
    if (isAdminRoute) {
      setSessionReady(true);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const authName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Estudiante';
        setIsLoggedIn(true);
        setUserName(authName);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        // Cargar nombre real desde student_profiles
        try {
          const { data: prof } = await supabase
            .from('student_profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (prof?.full_name) setUserName(prof.full_name);
        } catch (_) { /* ignore */ }
      }
      setSessionReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Estudiante';
        setIsLoggedIn(true);
        setUserName(authName);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        // Cargar nombre real desde student_profiles
        try {
          const { data: prof } = await supabase
            .from('student_profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (prof?.full_name) setUserName(prof.full_name);
        } catch (_) { /* ignore */ }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserName('');
        setUserId('');
        setUserEmail('');
      }
    });

    return () => subscription.unsubscribe();
  }, [isAdminRoute]);

  const handleLogin = (email: string, name: string, uid?: string, isAdmin?: boolean, country?: string, city?: string, isNewReg?: boolean) => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserEmail(email);
    if (uid) setUserId(uid);
    if (country) setUserCountry(country);
    if (city) setUserCity(city);
    setAuthModal(null);

    // Solo ir al panel admin si isAdmin=true fue EXPLÍCITAMENTE aprobado
    if (isAdmin === true) {
      setTimeout(() => navigate(ADMIN_ROUTES.DASHBOARD), 300);
      return;
    }

    // Nuevo registro → mostrar OnboardingFlow antes del Dashboard
    if (isNewReg) {
      setShowOnboarding(true);
      setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 300);
      return;
    }

    // Login normal → Dashboard de estudiante
    setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 300);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserName('');
    setUserId('');
    setUserEmail('');
    navigate(ROUTE_PATHS.HOME);
  };

  const sharedProps = {
    isLoggedIn,
    onOpenAuth: (modal: AuthModal) => setAuthModal(modal),
    onLogout: handleLogout,
    userName,
    userId,
  };

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path={ADMIN_ROUTES.LOGIN} element={<AdminLogin />} />
        <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
        <Route path={ADMIN_ROUTES.COURSES} element={<AdminCourses />} />
        <Route path={ADMIN_ROUTES.STUDENTS} element={<AdminStudents />} />
        <Route path={ADMIN_ROUTES.REVENUE} element={<AdminRevenue />} />
      </Routes>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path={ROUTE_PATHS.HOME}
          element={<Home onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />}
        />
        <Route path={ROUTE_PATHS.LESSONS} element={<Lessons {...sharedProps} />} />
        <Route path={ROUTE_PATHS.LIVE_CLASSES} element={<LiveClasses {...sharedProps} />} />
        <Route path={ROUTE_PATHS.DASHBOARD} element={<Dashboard {...sharedProps} />} />
        <Route path={ROUTE_PATHS.PRICING} element={<PricingPage {...sharedProps} />} />
        <Route path={ROUTE_PATHS.METHODOLOGY} element={<Methodology {...sharedProps} />} />
        <Route path={ROUTE_PATHS.FAQ} element={<FAQ {...sharedProps} />} />
        <Route path={ROUTE_PATHS.TERMS} element={<Terms {...sharedProps} />} />
        <Route path={ROUTE_PATHS.PRIVACY} element={<Privacy {...sharedProps} />} />
        <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPassword />} />
      </Routes>

      <AuthModals
        open={authModal}
        onClose={() => setAuthModal(null)}
        onLogin={(email, name, uid, isAdmin, country, city, isNewReg) => handleLogin(email, name, uid, isAdmin, country, city, isNewReg)}
      />

      {showOnboarding && userId && (
        <OnboardingFlow
          open={showOnboarding}
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userCountry={userCountry}
          userCity={userCity}
          onComplete={() => {
            setShowOnboarding(false);
            navigate(ROUTE_PATHS.DASHBOARD);
          }}
        />
      )}
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;