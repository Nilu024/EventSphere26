import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { homeFor } from '@/routes/routeConfig';

const links = [{ to: '/', label: 'Home' }, { to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }];

export default function MainLayout() {
  const { isAuthenticated, role } = useAuth();
  const [open, setOpen] = useState(false);
  const cta = isAuthenticated
    ? <Link to={homeFor(role)}><Button size="sm">Dashboard</Button></Link>
    : <><Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link><Link to="/register"><Button size="sm">Get started</Button></Link></>;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="ml-6 hidden gap-6 md:flex" aria-label="Primary">
            {links.map((l) => <NavLink key={l.to} to={l.to} end className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-primary' : 'text-muted hover:text-foreground'}`}>{l.label}</NavLink>)}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex"><ThemeToggle />{cta}</div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
        </div>
        {open && (
          <div className="space-y-3 border-t border-border px-4 py-4 md:hidden">
            {links.map((l) => <NavLink key={l.to} to={l.to} end onClick={() => setOpen(false)} className="block text-sm font-medium">{l.label}</NavLink>)}
            <div className="flex items-center gap-2 pt-2"><ThemeToggle />{cta}</div>
          </div>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>EventSphere – Connect. Collaborate. Grow.</p>
          <p>© {new Date().getFullYear()} EventSphere</p>
        </div>
      </footer>
    </div>
  );
}
