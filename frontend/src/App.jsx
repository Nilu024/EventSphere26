import { Toaster } from 'sonner';
import AppRoutes from '@/routes/AppRoutes';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  const { theme } = useTheme();
  return (<><AppRoutes /><Toaster richColors closeButton position="top-right" theme={theme} /></>);
}
