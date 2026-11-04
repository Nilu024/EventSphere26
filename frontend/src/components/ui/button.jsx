import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const variants = {
  primary: 'bg-primary text-primary-fg hover:opacity-90 shadow-sm',
  secondary: 'bg-secondary text-white hover:opacity-90 shadow-sm',
  accent: 'bg-accent text-white hover:opacity-90 shadow-sm',
  outline: 'border border-border bg-card hover:bg-muted-bg text-foreground',
  ghost: 'hover:bg-muted-bg text-foreground',
  danger: 'bg-danger text-white hover:opacity-90',
  subtle: 'bg-muted-bg text-foreground hover:opacity-80',
};
const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2', icon: 'h-9 w-9' };

export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, type = 'button', ...props }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap', variants[variant], sizes[size], className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
