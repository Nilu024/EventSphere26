import { useState } from 'react';
import { CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { QueryState } from '@/components/common/States';
import { EventCard } from '@/components/common/EventCard';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { useEvents, useMyRegistrations, useRegister } from '@/hooks/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import { PAGE_SIZE } from '@/utils/constants';
import { Link } from 'react-router-dom';

export default function Events() {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  // ASSUMPTION: list supports ?search, ?page, ?limit. Drafts are also hidden client-side.
  const q = useEvents({ search: debounced, page, limit: PAGE_SIZE });
  const regs = useMyRegistrations(); const register = useRegister();
  const registered = new Set((regs.data || []).filter((r) => r.status !== 'cancelled').map((r) => String(r.eventId)));
  const items = (q.data?.items || []).filter((e) => e.status !== 'draft');
  return (
    <>
      <PageHeader title="Explore events" description="Discover virtual events and register in one click." />
      <SearchBar className="mb-6 max-w-md" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search events…" />
      <QueryState query={q} items={items} empty={{ icon: CalendarX, title: 'No events found', description: debounced ? 'Try a different search.' : 'New events will appear here once published.' }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <EventCard key={e.id} event={e} to={`/participant/events/${e.id}`} actions={registered.has(String(e.id))
              ? <Link to="/participant/my-events"><Button size="sm" variant="subtle">Registered ✓</Button></Link>
              : <Button size="sm" loading={register.isPending && register.variables === e.id} disabled={['cancelled', 'completed'].includes(e.status)} onClick={() => register.mutate(e.id)}>Register</Button>} />
          ))}
        </div>
        <Pagination page={q.data?.page || page} pages={q.data?.pages} onChange={setPage} />
      </QueryState>
    </>
  );
}
