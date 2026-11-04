import { useState } from 'react';
import { Check, UserX, Users } from 'lucide-react';
import { QueryState } from '@/components/common/States';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { useAttendanceList, useEventRegistrations, useMarkAttendance } from '@/hooks/useEvents';
import { formatDateTime } from '@/utils/formatDate';
import { pick, userView } from '@/utils/fields';

function AttendanceRecords({ eventId }) {
  const q = useAttendanceList(eventId);
  const rows = (q.data || []).map((r, i) => {
    const u = userView(r.user || r.participant || {});
    return { id: r._id || r.id || i, name: u.name, status: String(pick(r, ['status'], pick(r, ['checkInTime', 'checkedInAt']) ? 'present' : 'unknown')).toLowerCase(), checkIn: pick(r, ['checkInTime', 'checkedInAt', 'checkIn']), checkOut: pick(r, ['checkOutTime', 'checkedOutAt', 'checkOut']) };
  });
  return (
    <QueryState query={q} items={rows} skeleton="rows" empty={{ title: 'No attendance records yet', description: 'Records appear after participants check in or are marked present.' }}>
      <DataTable rows={rows} columns={[
        { key: 'name', header: 'Participant' }, { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'checkIn', header: 'Check-in', render: (r) => (r.checkIn ? formatDateTime(r.checkIn) : '—') }, { key: 'checkOut', header: 'Check-out', render: (r) => (r.checkOut ? formatDateTime(r.checkOut) : '—') },
      ]} />
    </QueryState>
  );
}

export default function RegistrationsPanel({ eventId }) {
  const [page, setPage] = useState(1);
  const q = useEventRegistrations(eventId, { page, limit: 20 });
  const mark = useMarkAttendance(eventId);
  const rows = q.data?.items || [];
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 font-semibold">Registrations {q.data?.total !== undefined && <span className="text-muted">({q.data.total})</span>}</h3>
        <QueryState query={q} items={rows} skeleton="rows" empty={{ icon: Users, title: 'No registrations yet', description: 'Participants who register will be listed here.' }}>
          <DataTable rows={rows} columns={[
            { key: 'user', header: 'Participant', render: (r) => (<div className="flex items-center gap-3"><Avatar src={r.user?.avatar} name={r.user?.name} size="sm" /><div><p className="font-medium">{r.user?.name || String(r.userId)}</p><p className="text-xs text-muted">{r.user?.email}</p></div></div>) },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'createdAt', header: 'Registered', render: (r) => formatDateTime(r.createdAt) },
            { key: 'actions', header: 'Attendance', className: 'text-right', render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" disabled={mark.isPending || !r.userId} onClick={() => mark.mutate({ userId: r.userId, status: 'present' })}><Check className="h-3.5 w-3.5" />Present</Button>
                <Button size="sm" variant="ghost" disabled={mark.isPending || !r.userId} onClick={() => mark.mutate({ userId: r.userId, status: 'absent' })}><UserX className="h-3.5 w-3.5" />Absent</Button>
              </div>) },
          ]} />
          <Pagination page={q.data?.page || page} pages={q.data?.pages} onChange={setPage} />
        </QueryState>
      </section>
      <section><h3 className="mb-3 font-semibold">Attendance records</h3><AttendanceRecords eventId={eventId} /></section>
    </div>
  );
}
