import { useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { QueryState } from '@/components/common/States';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { useUserMutations, useUsers } from '@/hooks/useSocial';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';

/** ASSUMPTION: list accepts ?search ?role ?page ?limit; status values are 'active' / 'inactive'. */
export default function Users({ roleFilter }) {
  const { user: me } = useAuth();
  const [search, setSearch] = useState(''); const [role, setRole] = useState(roleFilter || 'all'); const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null); const [roleChange, setRoleChange] = useState(null);
  const debounced = useDebounce(search);
  const effectiveRole = roleFilter || role;
  const q = useUsers({ search: debounced, role: effectiveRole, page, limit: 15 });
  const m = useUserMutations();
  const rows = (q.data?.items || []).filter((u) => effectiveRole === 'all' || !u.role || u.role.toLowerCase() === effectiveRole);

  return (
    <>
      <PageHeader title={roleFilter === 'organizer' ? 'Organizers' : 'Users'} description={roleFilter ? 'Review and manage organizer accounts.' : 'Manage every account on the platform.'} />
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar className="w-full max-w-sm" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" />
        {!roleFilter && <Select className="w-44" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role"><option value="all">All roles</option><option value="participant">Participants</option><option value="organizer">Organizers</option><option value="admin">Admins</option></Select>}
      </div>
      <QueryState query={q} items={rows} skeleton="rows" empty={{ icon: UsersIcon, title: 'No users found', description: 'Try adjusting your search or filters.' }}>
        <DataTable rows={rows} columns={[
          { key: 'name', header: 'User', render: (u) => (<div className="flex items-center gap-3"><Avatar src={u.avatar} name={u.name} size="sm" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div></div>) },
          { key: 'role', header: 'Role', render: (u) => <Badge tone="purple">{u.role}</Badge> },
          { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
          { key: 'createdAt', header: 'Joined', render: (u) => formatDate(u.createdAt) },
          { key: 'actions', header: 'Actions', className: 'text-right', render: (u) => u.id === me?.id ? <span className="text-xs text-muted">You</span> : (
            <div className="flex flex-wrap justify-end gap-1">
              <Select className="h-8 w-32 text-xs" aria-label={`Role for ${u.name}`} value={u.role?.toLowerCase() || ''} onChange={(e) => setRoleChange({ user: u, role: e.target.value })}>
                {['participant', 'organizer', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Button size="sm" variant={u.status === 'active' ? 'outline' : 'accent'} onClick={() => setConfirm({ user: u, status: u.status === 'active' ? 'inactive' : 'active' })}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
            </div>) },
        ]} />
        <Pagination page={q.data?.page || page} pages={q.data?.pages} onChange={setPage} />
      </QueryState>

      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} danger={confirm?.status === 'inactive'} loading={m.status.isPending}
        title={`${confirm?.status === 'inactive' ? 'Deactivate' : 'Activate'} ${confirm?.user.name}?`} confirmLabel="Confirm"
        onConfirm={() => m.status.mutate({ id: confirm.user.id, status: confirm.status }, { onSuccess: () => setConfirm(null) })} />
      <ConfirmDialog open={Boolean(roleChange)} onClose={() => setRoleChange(null)} loading={m.role.isPending} danger={roleChange?.role === 'admin'}
        title={`Change ${roleChange?.user.name}'s role to ${roleChange?.role}?`} confirmLabel="Change role"
        onConfirm={() => m.role.mutate({ id: roleChange.user.id, role: roleChange.role }, { onSuccess: () => setRoleChange(null) })} />
    </>
  );
}
