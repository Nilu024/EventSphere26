import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Pencil, Send, Settings2, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { useEventMutations } from '@/hooks/useEvents';

/** Publish / cancel / complete / delete controls with confirmation. Backend still enforces ownership and state rules. */
export function EventLifecycleActions({ event, base, canEdit = true }) {
  const m = useEventMutations();
  const [action, setAction] = useState(null);
  const status = event.status;
  const cfg = {
    publish: { title: 'Publish this event?', label: 'Publish', mutation: m.publish },
    cancel: { title: 'Cancel this event?', label: 'Cancel event', mutation: m.cancel, danger: true },
    complete: { title: 'Mark event as completed?', label: 'Mark complete', mutation: m.complete },
    delete: { title: 'Delete this event?', label: 'Delete', mutation: m.remove, danger: true },
  }[action];
  return (
    <>
      {canEdit && <Link to={`${base}/events/${event.id}`}><Button size="sm" variant="outline"><Settings2 className="h-3.5 w-3.5" />Manage</Button></Link>}
      {canEdit && <Link to={`${base}/events/${event.id}/edit`}><Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" />Edit</Button></Link>}
      {status === 'draft' && <Button size="sm" variant="accent" onClick={() => setAction('publish')}><Send className="h-3.5 w-3.5" />Publish</Button>}
      {status === 'published' && <Button size="sm" variant="subtle" onClick={() => setAction('complete')}><CheckCircle2 className="h-3.5 w-3.5" />Complete</Button>}
      {['draft', 'published'].includes(status) && <Button size="sm" variant="ghost" onClick={() => setAction('cancel')}><XCircle className="h-3.5 w-3.5" />Cancel</Button>}
      <Button size="sm" variant="ghost" aria-label={`Delete ${event.title}`} onClick={() => setAction('delete')}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
      {cfg && <ConfirmDialog open onClose={() => setAction(null)} title={cfg.title} confirmLabel={cfg.label} danger={cfg.danger} loading={cfg.mutation.isPending}
        onConfirm={() => cfg.mutation.mutate(event.id, { onSuccess: () => setAction(null) })} />}
    </>
  );
}
