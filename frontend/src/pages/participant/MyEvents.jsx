import { useState } from 'react';
import { Ticket, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { EventCard } from '@/components/common/EventCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { KeyValueList } from '@/components/common/KeyValueList';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { useCancelRegistration, useCheckIn, useCheckOut, useMyAttendance, useMyRegistrations } from '@/hooks/useEvents';

function AttendanceModal({ eventId, onClose }) {
  const q = useMyAttendance(eventId, Boolean(eventId));
  return (
    <Modal open={Boolean(eventId)} onClose={onClose} title="My attendance">
      {q.isLoading ? <p className="text-sm text-muted">Loading…</p> : q.isError ? <p className="text-sm text-muted">No attendance recorded yet.</p> : <KeyValueList data={q.data?.attendance || q.data} />}
    </Modal>
  );
}

export default function MyEvents() {
  const q = useMyRegistrations();
  const cancel = useCancelRegistration(); const checkIn = useCheckIn(); const checkOut = useCheckOut();
  const [tab, setTab] = useState('upcoming'); const [toCancel, setToCancel] = useState(null); const [attId, setAttId] = useState(null);
  const regs = (q.data || []).filter((r) => r.status !== 'cancelled');
  const isPast = (r) => ['completed', 'cancelled'].includes(r.event?.status) || (r.event?.end && new Date(r.event.end) < new Date());
  const shown = regs.filter((r) => (tab === 'past' ? isPast(r) : !isPast(r)));
  return (
    <>
      <PageHeader title="My events" description="Events you are registered for." />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
      <QueryState query={q} items={shown} empty={{ icon: Ticket, title: tab === 'past' ? 'No past events' : 'No upcoming events', description: 'Register for an event to see it here.', action: <Link to="/participant/events"><Button>Explore events</Button></Link> }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => r.event ? (
            <EventCard key={r.id} event={r.event} to={`/participant/events/${r.eventId}`} actions={<>
              <Button size="sm" variant="outline" onClick={() => checkIn.mutate(r.eventId)}><LogIn className="h-3.5 w-3.5" />Check in</Button>
              <Button size="sm" variant="outline" onClick={() => checkOut.mutate(r.eventId)}><LogOut className="h-3.5 w-3.5" />Check out</Button>
              <Button size="sm" variant="subtle" onClick={() => setAttId(r.eventId)}>Attendance</Button>
              <Button size="sm" variant="ghost" onClick={() => setToCancel(r.eventId)}>Cancel</Button>
            </>} />
          ) : (
            /* Registration without an embedded event object – link through by id. */
            <Link key={r.id} to={`/participant/events/${r.eventId}`} className="rounded-xl border border-border bg-card p-4 text-sm hover:shadow-md">Event {String(r.eventId)}</Link>
          ))}
        </div>
      </QueryState>
      <ConfirmDialog open={Boolean(toCancel)} onClose={() => setToCancel(null)} danger title="Cancel registration?" confirmLabel="Cancel registration" loading={cancel.isPending} onConfirm={() => cancel.mutate(toCancel, { onSuccess: () => setToCancel(null) })} />
      <AttendanceModal eventId={attId} onClose={() => setAttId(null)} />
    </>
  );
}
