import { Outlet, Navigate } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { homeFor } from '@/routes/routeConfig';
import { Loader } from '@/components/common/States';

export default function AuthLayout() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <Loader />;
  if (isAuthenticated) return <Navigate to={homeFor(role)} replace />;
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] p-10 text-white lg:flex">
        <Logo className="text-white [&_span]:text-white" />
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">Where events become lasting professional connections.</h2>
          <p className="mt-4 max-w-md text-white/75">Smart matchmaking, speed networking, live Q&A and private chat – all in one platform.</p>
        </div>
        <p className="text-sm text-white/60">EventSphere – Connect. Collaborate. Grow.</p>
      </div>
      <div className="flex flex-col p-6">
        <div className="flex items-center justify-between lg:justify-end"><Logo className="lg:hidden" /><ThemeToggle /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8"><Outlet /></div>
      </div>
    </div>
  );
}
