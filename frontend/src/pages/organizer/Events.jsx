import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { QueryState } from '@/components/common/States';
import { EventCard } from '@/components/common/EventCard';
import { EventLifecycleActions } from '@/components/common/EventLifecycleActions';
import { Select } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useManageableEvents } from '@/hooks/useEvents';

export default function OrganizerEvents() {
  const q = useManageableEvents();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const items = q.items.filter((e) => (status === 'all' || e.status === status) && e.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader title="My events" description="Create, publish and manage your events."
        actions={<Link to="/organizer/events/create"><Button><CalendarPlus className="h-4 w-4" />Create event</Button></Link>} />
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar className="w-full max-w-sm" value={search} onChange={setSearch} placeholder="Search events…" />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>{['draft', 'published', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </Select>
      </div>
      <QueryState query={q} items={items} empty={{ icon: CalendarX, title: 'No events found', description: 'Create your first event to get started.', action: <Link to="/organizer/events/create"><Button>Create event</Button></Link> }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => <EventCard key={e.id} event={e} to={`/organizer/events/${e.id}`} actions={<EventLifecycleActions event={e} base="/organizer" />} />)}
        </div>
      </QueryState>
    </>
  );
}
