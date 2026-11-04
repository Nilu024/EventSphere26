import { useState } from 'react';
import { Inbox, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { Tabs } from '@/components/ui/tabs';
import { RequestCard } from '../components/RequestCard';
import { useConnectionMutations, useConnectionRequests } from '@/hooks/useSocial';

export default function ConnectionRequests() {
  const [tab, setTab] = useState('incoming');
  const q = useConnectionRequests(); const m = useConnectionMutations();
  const list = q.data?.[tab] || [];
  const busy = (id) => [m.accept, m.reject, m.cancel].some((x) => x.isPending && x.variables === id);
  return (
    <>
      <PageHeader title="Connection requests" description="Respond to invitations and track the ones you sent." />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'incoming', label: 'Incoming', count: q.data?.incoming.length }, { value: 'outgoing', label: 'Sent', count: q.data?.outgoing.length }]} />
      <QueryState query={q} items={list} skeleton="rows" empty={tab === 'incoming' ? { icon: Inbox, title: 'No incoming requests', description: 'When someone wants to connect, it will show up here.' } : { icon: Send, title: 'No pending sent requests' }}>
        <div className="space-y-3">{list.map((r) => <RequestCard key={r.id} request={r} busy={busy(r.id)} onAccept={() => m.accept.mutate(r.id)} onReject={() => m.reject.mutate(r.id)} onCancel={() => m.cancel.mutate(r.id)} />)}</div>
      </QueryState>
    </>
  );
}
