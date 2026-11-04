import { Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionForm } from './QuestionForm';
import { QuestionList } from './QuestionList';
import { useQuestionMutations, useQuestions } from '@/hooks/useSocial';
import { useSocket } from '@/hooks/useSocket';
import { SOCKET_EVENTS } from '@/services/socketEvents';

/** Live Q&A for one event. Updates arrive by polling (6s) and, once socket event names are configured, by push. */
export default function LiveQA({ eventId, canModerate = false, canAsk = true }) {
  const query = useQuestions(eventId);
  const mutations = useQuestionMutations(eventId);
  const { connected } = useSocket();
  const pushEnabled = Boolean(SOCKET_EVENTS.questionUpdate);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          {pushEnabled && connected ? <Badge tone="success"><Wifi className="mr-1 h-3 w-3" />Live</Badge> : <Badge><WifiOff className="mr-1 h-3 w-3" />Auto-refreshing every few seconds</Badge>}
        </div>
        <QuestionList query={query} canModerate={canModerate} mutations={mutations} />
      </div>
      {canAsk && <Card className="h-fit lg:sticky lg:top-24"><CardContent className="pt-5"><QuestionForm loading={mutations.ask.isPending} onSubmit={(v, done) => mutations.ask.mutate(v, { onSuccess: done })} /></CardContent></Card>}
    </div>
  );
}
