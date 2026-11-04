import { cn } from '@/utils/cn';
import { formatTime } from '@/utils/formatDate';
export function MessageBubble({ message }) {
  return (
    <div className={cn('flex', message.mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-sm', message.mine ? 'rounded-br-sm bg-primary text-primary-fg' : 'rounded-bl-sm bg-muted-bg')}>
        {/* Rendered as text (React escapes it) – never as HTML. */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn('mt-1 text-[10px]', message.mine ? 'text-primary-fg/70' : 'text-muted')}>{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}
