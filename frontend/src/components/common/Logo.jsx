import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
export function Logo({ to = '/', className, showText = true }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2 font-bold tracking-tight', className)} aria-label="EventSphere home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden><circle cx="16" cy="16" r="9" fill="none" stroke="var(--accent)" strokeWidth="3.5" /><circle cx="16" cy="16" r="3" fill="var(--secondary)" /></svg>
      </span>
      {showText && <span className="text-lg">Event<span className="text-secondary">Sphere</span></span>}
    </Link>
  );
}
