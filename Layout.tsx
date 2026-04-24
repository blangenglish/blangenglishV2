import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Video, TrendingUp, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { SiWhatsapp, SiInstagram, SiTiktok } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

export function Layout({ children, isLoggedIn = false, onOpenAuth, onLogout, userName }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === ROUTE_PATHS.HOME;

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Handle nav click: page routes, anchor links, cross-page anchors
  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      // anchor on current page
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (href.includes('#')) {
      // navigate to another page then scroll to anchor
      const [path, hash] = href.split('#');
      navigate(path);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    } else {
      navigate(href);
    }
  };

  const navLinks = isLoggedIn
    ? [
        { label: 'Mi Cuenta', href: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard },
      ]
    : [
        { label: 'Inicio', href: ROUTE_PATHS.HOME },
        { label: 'Metodología', href: ROUTE_PATHS.METHODOLOGY },
        { label: 'Precios', href: ROUTE_PATHS.PRICING },
        { label: 'Preguntas', href: ROUTE_PATHS.FAQ },
      ];

  const socialLinks = [
    { icon: SiWhatsapp, href: 'https://whatsapp.com/channel/0029VbCYgGe6WaKj1KPxei2F', label: 'WhatsApp' },
    { icon: SiInstagram, href: 'https://www.instagram.com/blangenglish/', label: 'Instagram' },
    { icon: SiTiktok, href: 'https://www.tiktok.com/@blangenglish', label: 'TikTok' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo — siempre lleva al inicio */}
            <Link
              to={isLoggedIn ? ROUTE_PATHS.DASHBOARD : ROUTE_PATHS.HOME}
              className="flex items-center"
            >
              <img src={IMAGES.BLANG_LOGO} alt="BLANG English Academy" className="h-8 sm:h-10 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname === link.href
                      ? 'text-primary font-semibold'
                      : 'text-foreground/70 hover:text-primary'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground/80">
                    👋 Hola, <span className="text-primary font-semibold">{userName || 'Estudiante'}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                    Salir
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onOpenAuth?.('login')} className="gap-1.5">
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </Button>
                  <Button size="sm" onClick={() => onOpenAuth?.('register')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5">
                    <UserPlus className="w-4 h-4" />
                    Registrarse gratis
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2 text-left"
                >
                  {link.label}
                </button>
              ))}
              {isLoggedIn ? (
                <Button variant="outline" className="w-full" onClick={onLogout}>
                  Cerrar sesión
                </Button>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={() => { onOpenAuth?.('login'); setMobileMenuOpen(false); }}>
                    Iniciar sesión
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground" onClick={() => { onOpenAuth?.('register'); setMobileMenuOpen(false); }}>
                    Registrarse gratis 🎉
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-foreground text-background mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG English Academy" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-sm text-background/70 max-w-md">
                Aprende inglés de forma fácil, divertida y efectiva. Diseñado especialmente para hispanohablantes que quieren hablar inglés con confianza. 🌎
              </p>
              <div className="flex gap-4 mt-6">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-background/50 hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-background">Plataforma</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Inicio', href: ROUTE_PATHS.HOME },
                  { label: 'Metodología', href: ROUTE_PATHS.METHODOLOGY },
                  { label: 'Precios', href: ROUTE_PATHS.PRICING },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-background/60 hover:text-background transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-background">Contáctanos — Preguntas Frecuentes</h3>
              <ul className="space-y-2">
                <li>
                  <Link to={ROUTE_PATHS.FAQ} className="text-sm text-background/60 hover:text-background transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.FAQ} className="text-sm text-background/60 hover:text-background transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.TERMS} className="text-sm text-background/60 hover:text-background transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.PRIVACY} className="text-sm text-background/60 hover:text-background transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 mt-8 pt-8 text-center">
            <p className="text-sm text-background/40">
              © 2026 BLANG English Academy. Todos los derechos reservados. Hecho con 💜 para hispanohablantes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
