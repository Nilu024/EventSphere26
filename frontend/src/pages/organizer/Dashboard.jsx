import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CalendarPlus, FileEdit, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { QueryState } from '@/components/common/States';
import { EventCard } from '@/components/common/EventCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useManageableEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const q = useManageableEvents();
  const count = (s) => q.items.filter((e) => e.status === s).length;
  const v = (n) => (q.isLoading ? '…' : q.isError ? '–' : n);
  const recent = q.items.slice(0, 3);
  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'organizer'}`} description="An overview of your events."
        actions={<><Link to="/organizer/events/create"><Button><CalendarPlus className="h-4 w-4" />Create event</Button></Link><Link to="/organizer/analytics"><Button variant="outline">Analytics</Button></Link></>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label="Total events" value={v(q.items.length)} />
        <StatCard icon={FileEdit} label="Drafts" value={v(count('draft'))} />
        <StatCard icon={CalendarCheck} label="Published" value={v(count('published'))} />
        <StatCard icon={CheckCircle2} label="Completed" value={v(count('completed'))} />
      </div>
      <Card className="mt-8"><CardHeader className="flex-row items-center justify-between"><CardTitle>Recent events</CardTitle><Link to="/organizer/events"><Button variant="ghost" size="sm">View all</Button></Link></CardHeader>
        <CardContent><QueryState query={q} items={recent} empty={{ title: 'No events yet', description: 'Create an event to get started.' }}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{recent.map((e) => <EventCard key={e.id} event={e} to={`/organizer/events/${e.id}`} />)}</div>
        </QueryState></CardContent></Card>
    </>
  );
}
