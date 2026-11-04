import { useMemo, useState } from 'react';
import { PhoneOff } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MeetingTimer } from './MeetingTimer';
import { VideoMeeting } from './VideoMeeting';
import { DEFAULT_MEETING_SECONDS } from '@/utils/constants';

export function NetworkingRoom({ session, user, onEnd, ending }) {
  const [confirm, setConfirm] = useState(false);
  // End time: backend-provided end > start + backend duration > ASSUMED default (advisory only, never auto-ends).
  const { endsAt, authoritative } = useMemo(() => {
    const start = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    if (session.endsAt && !Number.isNaN(new Date(session.endsAt).getTime())) return { endsAt: new Date(session.endsAt).getTime(), authoritative: true };
    if (session.durationSeconds) return { endsAt: start + session.durationSeconds * 1000, authoritative: true };
    return { endsAt: start + DEFAULT_MEETING_SECONDS * 1000, authoritative: false };
  }, [session]);
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4 p-4">
        {session.partner ? (<div className="flex items-center gap-3"><Avatar src={session.partner.avatar} name={session.partner.name} /><div><p className="text-sm text-muted">You are meeting</p><p className="font-semibold leading-tight">{session.partner.name}</p>{session.partner.headline && <p className="text-xs text-muted">{session.partner.headline}</p>}</div></div>) : <Badge tone="success">Matched</Badge>}
        <div className="ml-auto flex items-center gap-3"><MeetingTimer endsAt={endsAt} authoritative={authoritative} onExpire={onEnd} /><Button variant="danger" onClick={() => setConfirm(true)}><PhoneOff className="h-4 w-4" />End meeting</Button></div>
      </Card>
      <VideoMeeting session={session} user={user} onClose={onEnd} />
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} danger title="End this meeting?" confirmLabel="End meeting" loading={ending} onConfirm={() => { onEnd(); setConfirm(false); }} />
    </div>
  );
}
