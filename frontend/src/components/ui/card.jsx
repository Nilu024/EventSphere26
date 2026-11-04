import { cn } from '@/utils/cn';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-border bg-card shadow-sm', className)} {...p} />;
export const CardHeader = ({ className, ...p }) => <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn('text-base font-semibold tracking-tight', className)} {...p} />;
export const CardDescription = ({ className, ...p }) => <p className={cn('text-sm text-muted', className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn('p-5 pt-2', className)} {...p} />;
