import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { QueryState } from '@/components/common/States';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { useEventMutations, useEvents } from '@/hooks/useEvents';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/formatDate';

export default function AdminEvents() {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const debounced = useDebounce(search);
  const q = useEvents({ search: debounced, limit: 100 });
  const m = useEventMutations();
  const [act, setAct] = useState(null);
  const rows = (q.data?.items || []).filter((e) => status === 'all' || e.status === status);
  const cfg = act && { cancel: { m: m.cancel, label: 'Cancel event', danger: true }, remove: { m: m.remove, label: 'Delete', danger: true }, publish: { m: m.publish, label: 'Publish' } }[act.type];
  return (
    <>
      <PageHeader title="Event moderation" description="Review, publish, cancel or remove any event on the platform." />
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar className="w-full max-w-sm" value={search} onChange={setSearch} placeholder="Search events…" />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{['draft', 'published', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
      </div>
      <QueryState query={q} items={rows} skeleton="rows" empty={{ icon: CalendarX, title: 'No events found' }}>
        <DataTable rows={rows} columns={[
          { key: 'title', header: 'Event', render: (e) => <Link to={`/admin/events/${e.id}`} className="font-medium hover:text-accent">{e.title}</Link> },
          { key: 'organizer', header: 'Organizer', render: (e) => e.organizerName || '—' },
          { key: 'start', header: 'Starts', render: (e) => formatDateTime(e.start) },
          { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
          { key: 'actions', header: 'Actions', className: 'text-right', render: (e) => (
            <div className="flex justify-end gap-1">
              {e.status === 'draft' && <Button size="sm" variant="accent" onClick={() => setAct({ type: 'publish', e })}>Publish</Button>}
              {['draft', 'published'].includes(e.status) && <Button size="sm" variant="outline" onClick={() => setAct({ type: 'cancel', e })}>Cancel</Button>}
              <Button size="sm" variant="ghost" onClick={() => setAct({ type: 'remove', e })}>Delete</Button>
            </div>) },
        ]} />
      </QueryState>
      {cfg && <ConfirmDialog open onClose={() => setAct(null)} danger={cfg.danger} title={`${cfg.label}: ${act.e.title}?`} confirmLabel={cfg.label} loading={cfg.m.isPending} onConfirm={() => cfg.m.mutate(act.e.id, { onSuccess: () => setAct(null) })} />}
    </>
  );
}
