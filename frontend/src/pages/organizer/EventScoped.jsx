import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EventPicker } from '@/components/common/EventPicker';
import { EmptyState } from '@/components/common/States';
import { CalendarSearch } from 'lucide-react';

/** Page shell that asks the organizer to pick an event, then renders `children(eventId)`. Selection lives in ?event=. */
export default function EventScoped({ title, description, children }) {
  const [params, setParams] = useSearchParams();
  const eventId = params.get('event') || '';
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="mb-6"><EventPicker value={eventId} onChange={(v) => setParams(v ? { event: v } : {})} /></div>
      {eventId ? children(eventId) : <EmptyState icon={CalendarSearch} title="Select an event" description="Choose an event above to continue." />}
    </>
  );
}
