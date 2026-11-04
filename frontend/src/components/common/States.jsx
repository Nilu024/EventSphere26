import { AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/services/adapters';

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-muted-bg p-3 text-muted"><Icon className="h-6 w-6" aria-hidden /></div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Could not load this data' }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-7 w-7 text-danger" aria-hidden />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{getErrorMessage(error)}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden"><Skeleton className="h-32 rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-2/3" /></div></Card>
      ))}
    </div>
  );
}
export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (<Card key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div></Card>))}
    </div>
  );
}

/**
 * Wraps a useQuery result: skeleton → error (with retry) → empty → children.
 * `items` decides emptiness; omit it for non-list data.
 */
export function QueryState({ query, items, skeleton = 'cards', empty, children }) {
  if (query.isLoading) return skeleton === 'rows' ? <SkeletonRows /> : skeleton === 'cards' ? <SkeletonCards /> : <Skeleton className="h-40 w-full" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (items && items.length === 0) return <EmptyState {...empty} />;
  return children;
}

export function Loader({ label = 'Loading…' }) {
  return <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-muted"><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />{label}</div>;
}
