import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

const base = 'w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-2 disabled:opacity-60';
export const Input = forwardRef(function Input({ className, ...p }, ref) { return <input ref={ref} className={cn(base, 'h-10', className)} {...p} />; });
export const Textarea = forwardRef(function Textarea({ className, ...p }, ref) { return <textarea ref={ref} className={cn(base, 'py-2 min-h-24', className)} {...p} />; });
export const Select = forwardRef(function Select({ className, children, ...p }, ref) { return <select ref={ref} className={cn(base, 'h-10', className)} {...p}>{children}</select>; });
export const Label = ({ className, ...p }) => <label className={cn('text-sm font-medium', className)} {...p} />;

/** Label + control + error, wiring ids/aria for accessibility. Pass a render-prop or a single child. */
export function Field({ label, error, hint, children, className }) {
  const id = useId();
  const child = typeof children === 'function' ? children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-err` : undefined }) : children;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {child}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs text-danger">{error.message || error}</p>}
    </div>
  );
}
