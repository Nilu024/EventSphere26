import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles, Users, Video, Ticket, Bell } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { QueryState } from '@/components/common/States';
import { EventCard } from '@/components/common/EventCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useMyRegistrations } from '@/hooks/useEvents';
import { useConnections, useConnectionRequests } from '@/hooks/useSocial';
import { useNotifications } from '@/hooks/useNotifications';

const shortcuts = [
  { to: '/participant/matchmaker', icon: Sparkles, label: 'Find matches' },
  { to: '/participant/networking', icon: Video, label: 'Speed networking' },
  { to: '/participant/events', icon: CalendarDays, label: 'Explore events' },
  { to: '/participant/chat', icon: Users, label: 'Open chat' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const regs = useMyRegistrations(); const conns = useConnections(); const reqs = useConnectionRequests(); const { unread } = useNotifications();
  const events = useEvents({ limit: 3 });
  const upcoming = (events.data?.items || []).filter((e) => e.status === 'published').slice(0, 3);
  const val = (q, f) => (q.isLoading ? '…' : q.isError ? '–' : f(q.data));
  return (
    <>
      <PageHeader title={`Hello, ${user?.name?.split(' ')[0] || 'there'} 👋`} description="Here is what is happening in your network." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Ticket} label="Registered events" value={val(regs, (d) => d.filter((r) => r.status !== 'cancelled').length)} />
        <StatCard icon={Users} label="Connections" value={val(conns, (d) => d.length)} />
        <StatCard icon={Sparkles} label="Pending requests" value={val(reqs, (d) => d.incoming.length)} />
        <StatCard icon={Bell} label="Unread notifications" value={unread} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map(({ to, icon: Icon, label }) => (<Link key={to} to={to}><Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md"><Icon className="h-5 w-5 text-accent" /><span className="text-sm font-medium">{label}</span></Card></Link>))}
      </div>
      <Card className="mt-8"><CardHeader className="flex-row items-center justify-between"><CardTitle>Upcoming events</CardTitle><Link to="/participant/events"><Button variant="ghost" size="sm">View all</Button></Link></CardHeader>
        <CardContent><QueryState query={events} items={upcoming} empty={{ title: 'No events available', description: 'Check back soon.' }}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{upcoming.map((e) => <EventCard key={e.id} event={e} to={`/participant/events/${e.id}`} />)}</div>
        </QueryState></CardContent></Card>
    </>
  );
}
