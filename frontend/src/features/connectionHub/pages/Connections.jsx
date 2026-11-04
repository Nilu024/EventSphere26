import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SearchBar } from '@/components/common/SearchBar';
import { Tabs } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConnectionCard } from '../components/ConnectionCard';
import { useBlocked, useConnectionMutations, useConnections } from '@/hooks/useSocial';

export default function Connections() {
  const [tab, setTab] = useState('connections'); const [search, setSearch] = useState(''); const [action, setAction] = useState(null);
  const q = useConnections(); const blocked = useBlocked(); const m = useConnectionMutations();
  const items = (q.data || []).filter((c) => c.user.name.toLowerCase().includes(search.toLowerCase()));
  const cfg = action && (action.type === 'remove' ? { fn: () => m.remove.mutate(action.c.id, { onSuccess: () => setAction(null) }), title: `Remove ${action.c.user.name}?`, label: 'Remove', busy: m.remove.isPending }
    : { fn: () => m.block.mutate(action.c.user.id, { onSuccess: () => setAction(null) }), title: `Block ${action.c.user.name}?`, label: 'Block', busy: m.block.isPending });
  return (
    <>
      <PageHeader title="Connections" description="Your professional network." actions={<Link to="/participant/matchmaker"><Button variant="outline">Find people</Button></Link>} />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'connections', label: 'Connections', count: q.data?.length }, { value: 'blocked', label: 'Blocked', count: blocked.data?.length }]} />
      {tab === 'connections' ? (<>
        <SearchBar className="mb-4 max-w-sm" value={search} onChange={setSearch} placeholder="Search connections…" />
        <QueryState query={q} items={items} skeleton="rows" empty={{ icon: Users, title: 'No connections yet', description: 'Send requests from the matchmaker to start building your network.', action: <Link to="/participant/matchmaker"><Button>Open matchmaker</Button></Link> }}>
          <div className="space-y-3">{items.map((c) => <ConnectionCard key={c.id} connection={c} onRemove={() => setAction({ type: 'remove', c })} onBlock={() => setAction({ type: 'block', c })} />)}</div>
        </QueryState></>
      ) : (
        <QueryState query={blocked} items={blocked.data} skeleton="rows" empty={{ icon: Ban, title: 'No blocked users' }}>
          <div className="space-y-3">{blocked.data?.map((u) => (<Card key={u.id} className="flex items-center gap-3 p-4"><Avatar src={u.avatar} name={u.name} /><p className="flex-1 font-medium">{u.name}</p><Button size="sm" variant="outline" loading={m.unblock.isPending && m.unblock.variables === u.id} onClick={() => m.unblock.mutate(u.id)}>Unblock</Button></Card>))}</div>
        </QueryState>
      )}
      {cfg && <ConfirmDialog open onClose={() => setAction(null)} danger title={cfg.title} confirmLabel={cfg.label} loading={cfg.busy} onConfirm={cfg.fn} />}
    </>
  );
}
