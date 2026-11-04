import { useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';
import { formatClock } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

/** Counts down to `endsAt` (ms epoch). `onExpire` fires once, only when the end time is authoritative (sent by the backend). */
export function MeetingTimer({ endsAt, authoritative, onExpire }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const remaining = Math.max(0, Math.round((endsAt - now) / 1000));
  useEffect(() => { if (remaining === 0 && authoritative && !fired.current) { fired.current = true; onExpire?.(); } }, [remaining, authoritative, onExpire]);
  return (
    <div role="timer" aria-live="off" className={cn('inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-semibold', remaining <= 30 ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent')}>
      <Timer className="h-4 w-4" aria-hidden />{formatClock(remaining)}
      {!authoritative && <span className="font-sans text-[10px] font-normal uppercase text-muted">est.</span>}
    </div>
  );
}
