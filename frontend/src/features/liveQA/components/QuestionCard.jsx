import { ArrowBigUp, Check, CheckCheck, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

/** Moderation statuses sent to PATCH /questions/{id}/moderate are ASSUMPTIONS: approved | answered | rejected. */
export function QuestionCard({ question, canModerate, onToggleUpvote, onModerate, voting, moderating }) {
  const q = question;
  return (
    <Card className={cn('flex gap-4 p-4', q.status === 'answered' && 'border-accent/40', q.status === 'rejected' && 'opacity-60')}>
      <button onClick={onToggleUpvote} disabled={voting} aria-pressed={q.hasUpvoted} aria-label={q.hasUpvoted ? 'Remove upvote' : 'Upvote question'}
        className={cn('flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border transition-colors disabled:opacity-60', q.hasUpvoted ? 'border-accent bg-accent text-white' : 'border-border hover:bg-muted-bg')}>
        <ArrowBigUp className="h-5 w-5" aria-hidden /><span className="text-sm font-semibold leading-none">{q.votes}</span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2"><StatusBadge status={q.status} /><span className="text-xs text-muted">{q.anonymous ? 'Anonymous' : q.authorName} {q.createdAt && `· ${timeAgo(q.createdAt)}`}</span></div>
        <p className="whitespace-pre-wrap break-words text-sm">{q.content}</p>
        {canModerate && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={moderating || q.status === 'approved'} onClick={() => onModerate('approved')}><Check className="h-3.5 w-3.5" />Approve</Button>
            <Button size="sm" variant="accent" disabled={moderating || q.status === 'answered'} onClick={() => onModerate('answered')}><CheckCheck className="h-3.5 w-3.5" />Answered</Button>
            <Button size="sm" variant="ghost" disabled={moderating || q.status === 'rejected'} onClick={() => onModerate('rejected')}><X className="h-3.5 w-3.5 text-danger" />Reject</Button>
          </div>)}
      </div>
    </Card>
  );
}
