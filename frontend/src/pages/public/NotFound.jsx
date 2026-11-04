import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-6xl font-black text-secondary">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/"><Button>Back to home</Button></Link>
    </div>
  );
}
