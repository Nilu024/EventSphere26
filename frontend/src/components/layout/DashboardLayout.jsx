import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NAV } from '@/routes/routeConfig';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

/** Shared shell for all three roles (admin / organizer / participant); the sidebar is driven by NAV[role]. */
export default function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV[role] || [];

  const onLogout = async () => { await logout(); toast.success('Signed out'); navigate('/login', { replace: true }); };

  const links = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end onClick={() => setOpen(false)}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-muted-bg hover:text-foreground')}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden />{label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5"><Logo to={`/${role}/dashboard`} /></div>
        {links}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5"><Logo to={`/${role}/dashboard`} /><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></Button></div>
            {links}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
        <div className="flex-1" />
        <Badge tone="purple">{role}</Badge>
        <ThemeToggle />
        <NotificationBell />
        <div className="flex items-center gap-2 pl-1">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <span className="hidden max-w-[10rem] truncate text-sm font-medium md:inline">{user?.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
      </header>

      <main id="main" className="mx-auto max-w-7xl p-4 sm:p-6"><Outlet /></main>
    </div>
  );
}
