import { cn } from '@/utils/cn';
export const Skeleton = ({ className, ...p }) => <div aria-hidden className={cn('skeleton h-4 w-full', className)} {...p} />;
