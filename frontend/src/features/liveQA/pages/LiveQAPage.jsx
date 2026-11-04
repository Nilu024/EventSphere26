import { useSearchParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EventPicker } from '@/components/common/EventPicker';
import { EmptyState } from '@/components/common/States';
import LiveQA from '../components/LiveQA';
import { useAuth } from '@/hooks/useAuth';
import { useMyRegistrations } from '@/hooks/useEvents';

/** Participants pick from their registered events; organizers from the events they manage (+ moderation controls). */
export default function LiveQAPage() {
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const eventId = params.get('event') || '';
  const regs = useMyRegistrations();
  const isOrganizer = role === 'organizer';
  const registeredEvents = (regs.data || []).filter((r) => r.event && r.status !== 'cancelled').map((r) => r.event);
  return (
    <>
      <PageHeader title="Live Q&A" description={isOrganizer ? 'Review and moderate audience questions.' : 'Ask questions and upvote the ones you care about.'} />
      <div className="mb-6"><EventPicker events={isOrganizer || !registeredEvents.length ? undefined : registeredEvents} value={eventId} onChange={(v) => setParams(v ? { event: v } : {})} /></div>
      {eventId ? <LiveQA key={eventId} eventId={eventId} canModerate={isOrganizer} canAsk={!isOrganizer} />
        : <EmptyState icon={MessagesSquare} title="Select an event" description={isOrganizer ? 'Choose one of your events to moderate its Q&A.' : 'Choose an event you are registered for to join its Q&A.'} />}
    </>
  );
}
