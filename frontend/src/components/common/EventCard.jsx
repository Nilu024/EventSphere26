import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/formatDate';

export function EventCard({ event, to, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <Link to={to} className="block">
          {event.banner
            ? <img src={event.banner} alt="" loading="lazy" className="h-36 w-full object-cover" />
            : <div className="flex h-36 items-end bg-gradient-to-br from-primary to-secondary p-4"><span className="text-3xl font-black text-white/30">{event.title.slice(0, 2).toUpperCase()}</span></div>}
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <Link to={to} className="line-clamp-2 font-semibold leading-snug hover:text-accent">{event.title}</Link>
            <StatusBadge status={event.status} />
          </div>
          <ul className="space-y-1 text-sm text-muted">
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden />{formatDateTime(event.start)}</li>
            {event.location && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{String(event.location)}</span></li>}
            {event.registeredCount !== undefined && <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" aria-hidden />{event.registeredCount}{event.capacity ? ` / ${event.capacity}` : ''} registered</li>}
          </ul>
          {event.category && <div><Badge tone="purple">{event.category}</Badge></div>}
          {actions && <div className="mt-auto flex flex-wrap gap-2 pt-1">{actions}</div>}
        </div>
      </Card>
    </motion.div>
  );
}
