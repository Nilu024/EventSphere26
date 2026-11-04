import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, Loader } from '@/components/common/States';
import { Tabs } from '@/components/ui/tabs';
import { NetworkingLobby } from '../components/NetworkingLobby';
import { WaitingQueue } from '../components/WaitingQueue';
import { NetworkingRoom } from '../components/NetworkingRoom';
import { SessionHistory } from '../components/SessionHistory';
import { useActiveNetSession, useNetMutations } from '@/hooks/useSocial';
import { useAuth } from '@/hooks/useAuth';

/**
 * States: lobby → waiting (in queue, polling /sessions/active) → active meeting → back to lobby.
 * "In queue" is tracked locally because the docs expose no queue-status endpoint; an active session
 * is always detected from the backend, so a page reload during a meeting resumes it.
 */
export default function Networking() {
  const { user } = useAuth();
  const [tab, setTab] = useState('lobby');
  const [inQueue, setInQueue] = useState(false);
  const active = useActiveNetSession(true, 3000);
  const { join, leave, end } = useNetMutations();
  const session = active.data;
  const live = session && !['ended', 'completed', 'cancelled'].includes(session.status);

  useEffect(() => { if (live) setInQueue(false); }, [live]);

  const doJoin = (eventId) => join.mutate(eventId, { onSuccess: () => setInQueue(true) });
  const doLeave = () => leave.mutate(undefined, { onSuccess: () => setInQueue(false) });
  const doEnd = () => { if (session?.id && !end.isPending) end.mutate(session.id); };

  return (
    <>
      <PageHeader title="Speed networking" description="Quick, focused one-to-one video conversations." />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'lobby', label: 'Lobby' }, { value: 'history', label: 'History' }]} />
      {tab === 'history' ? <SessionHistory /> : active.isLoading ? <Loader /> : active.isError && !live
        ? <ErrorState error={active.error} onRetry={() => active.refetch()} />
        : live ? <NetworkingRoom session={session} user={user} onEnd={doEnd} ending={end.isPending} />
        : inQueue ? <WaitingQueue onLeave={doLeave} leaving={leave.isPending} />
        : <NetworkingLobby onJoin={doJoin} joining={join.isPending} />}
    </>
  );
}
