import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { QueryState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/form';
import { useSessionMutations, useSessions } from '@/hooks/useEvents';
import { sessionSchema } from '@/utils/validators';
import { formatDateTime, formatTime, toInputDateTime } from '@/utils/formatDate';

function SessionForm({ eventId, session, onClose }) {
  const m = useSessionMutations(eventId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(sessionSchema) });
  useEffect(() => { reset(session ? { title: session.title, description: session.description, startTime: toInputDateTime(session.start), endTime: toInputDateTime(session.end) } : { title: '', description: '', startTime: '', endTime: '' }); }, [session, reset]);
  const busy = m.create.isPending || m.update.isPending;
  const onSubmit = (values) => (session ? m.update.mutate({ id: session.id, values }, { onSuccess: onClose }) : m.create.mutate(values, { onSuccess: onClose }));
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Title" error={errors.title}>{(p) => <Input {...p} {...register('title')} />}</Field>
      <Field label="Description" error={errors.description}>{(p) => <Textarea {...p} {...register('description')} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" error={errors.startTime}>{(p) => <Input type="datetime-local" {...p} {...register('startTime')} />}</Field>
        <Field label="Ends" error={errors.endTime}>{(p) => <Input type="datetime-local" {...p} {...register('endTime')} />}</Field>
      </div>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{session ? 'Save session' : 'Add session'}</Button></div>
    </form>
  );
}

export default function SessionsPanel({ eventId }) {
  const q = useSessions(eventId); const m = useSessionMutations(eventId);
  const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false); const [del, setDel] = useState(null);
  const close = () => { setOpen(false); setEditing(null); };
  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add session</Button></div>
      <QueryState query={q} items={q.data} skeleton="rows" empty={{ icon: Clock, title: 'No sessions yet', description: 'Add sessions to build the event agenda.' }}>
        <div className="space-y-3">{q.data?.map((s) => (
          <Card key={s.id} className="flex items-start justify-between gap-3 p-4">
            <div><p className="font-medium">{s.title}</p><p className="text-xs text-muted">{formatDateTime(s.start)} – {formatTime(s.end)}</p>{s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}</div>
            <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="Edit session" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Delete session" onClick={() => setDel(s)}><Trash2 className="h-4 w-4 text-danger" /></Button></div>
          </Card>))}</div>
      </QueryState>
      <Modal open={open} onClose={close} title={editing ? 'Edit session' : 'Add session'}><SessionForm eventId={eventId} session={editing} onClose={close} /></Modal>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} danger title={`Delete “${del?.title}”?`} confirmLabel="Delete" loading={m.remove.isPending} onConfirm={() => m.remove.mutate(del.id, { onSuccess: () => setDel(null) })} />
    </>
  );
}
