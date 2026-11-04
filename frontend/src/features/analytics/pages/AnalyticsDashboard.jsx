import { useSearchParams } from 'react-router-dom';
import { CalendarSearch } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EventPicker } from '@/components/common/EventPicker';
import { EmptyState, QueryState } from '@/components/common/States';
import { AnalyticsView } from '../components/AnalyticsView';
import { useAuth } from '@/hooks/useAuth';
import { useEventAnalytics, usePlatformAnalytics } from '@/hooks/useSocial';

export function PlatformAnalytics() {
  const q = usePlatformAnalytics();
  return <QueryState query={q} skeleton="block"><AnalyticsView data={q.data} /></QueryState>;
}
function EventAnalytics({ eventId }) {
  const q = useEventAnalytics(eventId);
  return <QueryState query={q} skeleton="block"><AnalyticsView data={q.data} /></QueryState>;
}

/** Admin → platform analytics (with optional per-event drill-down). Organizer → event analytics. */
export default function AnalyticsDashboard() {
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const eventId = params.get('event') || '';
  const picker = <div className="mb-6"><EventPicker value={eventId} onChange={(v) => setParams(v ? { event: v } : {})} label={role === 'admin' ? 'Drill into an event (optional)' : 'Select an event'} /></div>;
  return (
    <>
      <PageHeader title="Analytics" description={role === 'admin' ? 'Platform-wide statistics.' : 'Registrations, attendance and engagement for your events.'} />
      {role === 'admin' ? (<>{picker}{eventId ? <EventAnalytics eventId={eventId} /> : <PlatformAnalytics />}</>)
        : (<>{picker}{eventId ? <EventAnalytics eventId={eventId} /> : <EmptyState icon={CalendarSearch} title="Select an event" description="Choose an event to see its analytics." />}</>)}
    </>
  );
}
