import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Eye, ListChecks, Mic2, MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { EventLifecycleActions } from '@/components/common/EventLifecycleActions';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SessionsPanel from './panels/SessionsPanel';
import SpeakersPanel from './panels/SpeakersPanel';
import RegistrationsPanel from './panels/RegistrationsPanel';
import { useEvent } from '@/hooks/useEvents';
import { formatDateTime } from '@/utils/formatDate';

export default function EventManage() {
  const { eventId } = useParams();
  const q = useEvent(eventId);
  const [tab, setTab] = useState('sessions');
  return (
    <QueryState query={q} skeleton="block">
      {q.data && (<>
        <PageHeader title={q.data.title} description={`${formatDateTime(q.data.start)} → ${formatDateTime(q.data.end)}`}
          actions={<><StatusBadge status={q.data.status} /><Link to={`/organizer/events/${eventId}/view`}><Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" />Preview</Button></Link><Link to={`/organizer/live-qa?event=${eventId}`}><Button size="sm" variant="outline"><MessagesSquare className="h-3.5 w-3.5" />Q&A</Button></Link><Link to={`/organizer/analytics?event=${eventId}`}><Button size="sm" variant="outline"><BarChart3 className="h-3.5 w-3.5" />Analytics</Button></Link></>} />
        <div className="mb-6 flex flex-wrap items-center gap-2"><EventLifecycleActions event={q.data} base="/organizer" canEdit />
        </div>
        <Tabs className="mb-6 w-fit max-w-full" value={tab} onChange={setTab} tabs={[
          { value: 'sessions', label: 'Sessions', icon: <ListChecks className="h-4 w-4" /> },
          { value: 'speakers', label: 'Speakers', icon: <Mic2 className="h-4 w-4" /> },
          { value: 'registrations', label: 'Registrations & attendance', icon: <ClipboardCheck className="h-4 w-4" /> },
        ]} />
        {tab === 'sessions' && <SessionsPanel eventId={eventId} />}
        {tab === 'speakers' && <SpeakersPanel eventId={eventId} />}
        {tab === 'registrations' && <RegistrationsPanel eventId={eventId} />}
      </>)}
    </QueryState>
  );
}
