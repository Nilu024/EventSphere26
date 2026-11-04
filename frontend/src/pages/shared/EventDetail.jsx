import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock, LogIn, LogOut, MapPin, Mic2, Users, Settings2, MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState, EmptyState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { KeyValueList } from '@/components/common/KeyValueList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { useCancelRegistration, useCheckIn, useCheckOut, useEvent, useMyAttendance, useMyRegistrations, useRegister, useSessions, useSpeakers } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime, formatTime } from '@/utils/formatDate';

function AttendanceModal({ eventId, open, onClose }) {
  const q = useMyAttendance(eventId, open);
  return (
    <Modal open={open} onClose={onClose} title="My attendance">
      {q.isLoading ? <p className="text-sm text-muted">Loading…</p> : q.isError ? <p className="text-sm text-muted">No attendance record found yet for this event.</p> : <KeyValueList data={q.data?.attendance || q.data} />}
    </Modal>
  );
}

export default function EventDetail() {
  const { eventId } = useParams();
  const { role } = useAuth();
  const base = `/${role}`;
  const eq = useEvent(eventId);
  const sessions = useSessions(eventId);
  const speakers = useSpeakers(eventId);
  const regs = useMyRegistrations();
  const register = useRegister(); const cancel = useCancelRegistration(); const checkIn = useCheckIn(); const checkOut = useCheckOut();
  const [confirm, setConfirm] = useState(false); const [att, setAtt] = useState(false);

  const isParticipant = role === 'participant';
  const isRegistered = (regs.data || []).some((r) => String(r.eventId) === String(eventId) && r.status !== 'cancelled');
  const e = eq.data;

  return (
    <QueryState query={eq} skeleton="block">
      {e && (<>
        <Link to={role === 'participant' ? `${base}/events` : `${base}/events`} className="mb-3 inline-block text-sm text-accent hover:underline">← Back to events</Link>
        <Card className="mb-6 overflow-hidden">
          {e.banner ? <img src={e.banner} alt="" className="h-48 w-full object-cover sm:h-64" /> : <div className="h-32 bg-gradient-to-br from-primary to-secondary sm:h-48" />}
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="mb-2 flex items-center gap-2"><StatusBadge status={e.status} />{e.category && <Badge tone="purple">{e.category}</Badge>}</div><h1 className="text-2xl font-bold tracking-tight">{e.title}</h1></div>
              <div className="flex flex-wrap gap-2">
                {isParticipant && (isRegistered ? (<>
                  <Button variant="outline" onClick={() => checkIn.mutate(eventId)} loading={checkIn.isPending}><LogIn className="h-4 w-4" />Check in</Button>
                  <Button variant="outline" onClick={() => checkOut.mutate(eventId)} loading={checkOut.isPending}><LogOut className="h-4 w-4" />Check out</Button>
                  <Button variant="subtle" onClick={() => setAtt(true)}>My attendance</Button>
                  <Button variant="danger" onClick={() => setConfirm(true)}>Cancel registration</Button>
                </>) : <Button onClick={() => register.mutate(eventId)} loading={register.isPending} disabled={['cancelled', 'completed'].includes(e.status)}>Register now</Button>)}
                {role === 'organizer' && <Link to={`${base}/events/${eventId}`}><Button><Settings2 className="h-4 w-4" />Manage</Button></Link>}
                {isParticipant && isRegistered && <Link to={`${base}/live-qa?event=${eventId}`}><Button variant="accent"><MessagesSquare className="h-4 w-4" />Live Q&A</Button></Link>}
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateTime(e.start)} → {formatDateTime(e.end)}</li>
              {e.location && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" />{String(e.location)}</li>}
              {e.registeredCount !== undefined && <li className="flex items-center gap-2"><Users className="h-4 w-4" />{e.registeredCount}{e.capacity ? ` / ${e.capacity}` : ''} registered</li>}
            </ul>
            <p className="whitespace-pre-line text-sm leading-relaxed">{e.description}</p>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Agenda</CardTitle></CardHeader><CardContent>
            <QueryState query={sessions} items={sessions.data} skeleton="rows" empty={{ icon: Clock, title: 'No sessions yet', description: 'The agenda has not been published.' }}>
              <ol className="space-y-3">{sessions.data?.map((s) => (<li key={s.id} className="rounded-lg border border-border p-4"><p className="font-medium">{s.title}</p><p className="text-xs text-muted">{formatDateTime(s.start)} – {formatTime(s.end)}</p>{s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}</li>))}</ol>
            </QueryState></CardContent></Card>
          <Card><CardHeader><CardTitle>Speakers</CardTitle></CardHeader><CardContent>
            <QueryState query={speakers} items={speakers.data} skeleton="rows" empty={{ icon: Mic2, title: 'No speakers yet' }}>
              <ul className="space-y-4">{speakers.data?.map((s) => (<li key={s.id} className="flex gap-3"><Avatar src={s.image} name={s.name} /><div><p className="font-medium leading-tight">{s.name}</p><p className="text-xs text-muted">{[s.designation, s.company].filter(Boolean).join(' · ')}</p></div></li>))}</ul>
            </QueryState></CardContent></Card>
        </div>

        <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} danger title="Cancel your registration?" confirmLabel="Cancel registration" loading={cancel.isPending}
          onConfirm={() => cancel.mutate(eventId, { onSuccess: () => setConfirm(false) })} />
        <AttendanceModal eventId={eventId} open={att} onClose={() => setAtt(false)} />
      </>)}
    </QueryState>
  );
}
