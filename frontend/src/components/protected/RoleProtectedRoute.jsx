import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { homeFor } from '@/routes/routeConfig';

export default function RoleProtectedRoute({ allow }) {
  const { role } = useAuth();
  if (!allow.includes(role)) return <Navigate to={homeFor(role)} replace />;
  return <Outlet />;
}
