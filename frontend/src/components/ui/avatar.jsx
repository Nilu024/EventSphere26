import { cn } from '@/utils/cn';
import { initials } from '@/utils/fields';
export function Avatar({ src, name, size = 'md', className }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl' }[size];
  return src
    ? <img src={src} alt={name || 'avatar'} loading="lazy" className={cn('rounded-full object-cover shrink-0', s, className)} />
    : <span aria-label={name} className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-semibold text-primary-fg', s, className)}>{initials(name)}</span>;
}
