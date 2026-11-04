import { History } from 'lucide-react';
import { QueryState } from '@/components/common/States';
import { DataTable } from '@/components/common/DataTable';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { useNetHistory } from '@/hooks/useSocial';
import { formatDateTime } from '@/utils/formatDate';

export function SessionHistory() {
  const q = useNetHistory();
  return (
    <QueryState query={q} items={q.data} skeleton="rows" empty={{ icon: History, title: 'No sessions yet', description: 'Your completed speed-networking meetings will appear here.' }}>
      <DataTable rows={q.data || []} columns={[
        { key: 'partner', header: 'Met with', render: (s) => (<div className="flex items-center gap-3"><Avatar src={s.partner?.avatar} name={s.partner?.name} size="sm" /><span className="font-medium">{s.partner?.name || 'Participant'}</span></div>) },
        { key: 'startedAt', header: 'Date', render: (s) => formatDateTime(s.startedAt) },
        { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
      ]} />
    </QueryState>
  );
}
