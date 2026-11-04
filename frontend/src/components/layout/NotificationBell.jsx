import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/utils/formatDate';

export function NotificationBell() {
  const { items, unread, markRead, markAll } = useNotifications();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);
  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <button className="text-xs text-accent hover:underline" onClick={() => markAll.mutate()}>Mark all read</button>}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.slice(0, 6).map((n) => (
              <li key={n.id}><button onClick={() => !n.read && markRead.mutate(n.id)} className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted-bg">
                <span className={`text-sm ${n.read ? '' : 'font-semibold'}`}>{n.title}</span>
                {n.message && <span className="line-clamp-2 text-xs text-muted">{n.message}</span>}
                <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
              </button></li>
            ))}
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">You're all caught up.</li>}
          </ul>
          <Link to={`/${role}/notifications`} onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-sm text-accent hover:bg-muted-bg">View all</Link>
        </div>
      )}
    </div>
  );
}
