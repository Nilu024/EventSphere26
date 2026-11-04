import { Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/utils/formatDate';

export function RequestCard({ request, onAccept, onReject, onCancel, busy }) {
  const u = request.user;
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <Avatar src={u.avatar} name={u.name} size="lg" />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name}</p><p className="truncate text-sm text-muted">{[u.headline, u.company].filter(Boolean).join(' · ')}</p>
        {request.message && <p className="mt-1 text-sm italic text-muted">“{request.message}”</p>}<p className="text-xs text-muted">{timeAgo(request.createdAt)}</p></div>
      <div className="flex gap-2">
        {request.outgoing
          ? <Button size="sm" variant="outline" loading={busy} onClick={onCancel}>Cancel request</Button>
          : <><Button size="sm" loading={busy} onClick={onAccept}><Check className="h-3.5 w-3.5" />Accept</Button><Button size="sm" variant="outline" disabled={busy} onClick={onReject}><X className="h-3.5 w-3.5" />Decline</Button></>}
      </div>
    </Card>
  );
}
