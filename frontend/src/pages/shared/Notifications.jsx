import { BellOff, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/States';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

export default function Notifications() {
  const { items, unread, markRead, markAll, isLoading } = useNotifications();
  return (
    <>
      <PageHeader title="Notifications" description={unread ? `${unread} unread` : 'You are all caught up'}
        actions={unread > 0 && <Button variant="outline" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck className="h-4 w-4" />Mark all as read</Button>} />
      {isLoading ? <p className="text-sm text-muted">Loading…</p> : items.length === 0
        ? <EmptyState icon={BellOff} title="No notifications" description="Connection requests, messages and event updates will show up here." />
        : <div className="space-y-2">{items.map((n) => (
          <Card key={n.id} className={cn('flex items-start gap-3 p-4', !n.read && 'border-accent/40 bg-accent/5')}>
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} aria-hidden />
            <div className="min-w-0 flex-1"><p className="font-medium">{n.title}</p>{n.message && <p className="text-sm text-muted">{n.message}</p>}<p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p></div>
            {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>Mark read</Button>}
          </Card>))}</div>}
    </>
  );
}
