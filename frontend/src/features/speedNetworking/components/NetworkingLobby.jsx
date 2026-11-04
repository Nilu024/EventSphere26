import { useState } from 'react';
import { Video, Zap, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { EventPicker } from '@/components/common/EventPicker';
import { useMyRegistrations } from '@/hooks/useEvents';

export function NetworkingLobby({ onJoin, joining }) {
  const regs = useMyRegistrations();
  const [eventId, setEventId] = useState('');
  const events = (regs.data || []).filter((r) => r.event && r.status !== 'cancelled').map((r) => r.event);
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <CardContent className="space-y-6 py-10">
        <div className="mx-auto inline-flex rounded-2xl bg-accent/10 p-4 text-accent"><Video className="h-8 w-8" /></div>
        <div><h2 className="text-2xl font-bold">Speed networking lobby</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">Join the queue and get matched with another participant for a short video conversation.</p></div>
        <ul className="mx-auto flex max-w-md flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <li className="flex items-center gap-2"><Users className="h-4 w-4" />One-to-one</li><li className="flex items-center gap-2"><Clock className="h-4 w-4" />Time-boxed</li><li className="flex items-center gap-2"><Zap className="h-4 w-4" />Instant match</li>
        </ul>
        {events.length > 0 && (<div className="mx-auto max-w-sm text-left"><label className="mb-1.5 block text-sm font-medium">Event (optional)</label>
          <EventPicker events={events} value={eventId} onChange={setEventId} label="Any event" /></div>)}
        <Button size="lg" loading={joining} onClick={() => onJoin(eventId || undefined)}>Join the queue</Button>
      </CardContent>
    </Card>
  );
}
