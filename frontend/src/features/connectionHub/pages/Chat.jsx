import { Link, useParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ChatWindow } from '../components/ChatWindow';
import { useConnections } from '@/hooks/useSocial';
import { cn } from '@/utils/cn';

/** Chat is only offered for accepted connections; the backend still authorizes every message request. */
export default function Chat() {
  const { userId } = useParams();
  const q = useConnections();
  const peer = (q.data || []).find((c) => String(c.user.id) === String(userId))?.user;
  return (
    <>
      <PageHeader title="Messages" description="Chat privately with your connections." />
      <Card className="grid h-[calc(100vh-14rem)] min-h-[420px] overflow-hidden md:grid-cols-[320px_1fr]">
        <div className={cn('min-h-0 overflow-y-auto border-r border-border', userId && 'hidden md:block')}>
          <QueryState query={q} items={q.data} skeleton="rows" empty={{ icon: MessagesSquare, title: 'No conversations', description: 'Connect with people to start chatting.' }}>
            <ul>{q.data?.map((c) => (
              <li key={c.id}><Link to={`/participant/chat/${c.user.id}`} className={cn('flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-muted-bg', String(c.user.id) === String(userId) && 'bg-primary/10')}>
                <Avatar src={c.user.avatar} name={c.user.name} /><div className="min-w-0"><p className="truncate text-sm font-medium">{c.user.name}</p><p className="truncate text-xs text-muted">{c.user.headline}</p></div></Link></li>))}</ul>
          </QueryState>
        </div>
        <div className={cn('min-h-0', !userId && 'hidden md:flex md:items-center md:justify-center')}>
          {peer ? <ChatWindow key={peer.id} peer={peer} />
            : userId && q.isSuccess ? <p className="p-6 text-sm text-muted">This user is not one of your connections.</p>
            : !userId && <p className="text-sm text-muted">Select a conversation</p>}
        </div>
      </Card>
    </>
  );
}
