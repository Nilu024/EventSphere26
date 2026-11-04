import { useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/common/States';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useConversation, useSendMessage } from '@/hooks/useSocial';

/** Authorization is enforced by the backend: a 403/404 is shown as an error, never assumed accessible. */
export function ChatWindow({ peer }) {
  const q = useConversation(peer.id);
  const send = useSendMessage(peer.id);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [q.data?.length]);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border p-3">
        <Link to="/participant/chat" className="md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar src={peer.avatar} name={peer.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{peer.name}</p><p className="truncate text-xs text-muted">{peer.headline}</p></div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
        {q.isLoading ? <><Skeleton className="h-10 w-1/2" /><Skeleton className="ml-auto h-10 w-1/3" /><Skeleton className="h-10 w-2/5" /></>
          : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} title="Cannot load this conversation" />
          : q.data.length === 0 ? <EmptyState icon={MessageCircle} title="No messages yet" description={`Say hello to ${peer.name.split(' ')[0]}.`} />
          : q.data.map((m, i) => <MessageBubble key={m.id ?? i} message={m} />)}
        <div ref={end} />
      </div>
      <ChatInput sending={send.isPending} onSend={(content, done) => send.mutate(content, { onSuccess: done })} />
    </div>
  );
}
