import { Link } from 'react-router-dom';
import { Ban, MessageCircle, UserMinus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function ConnectionCard({ connection, onRemove, onBlock }) {
  const u = connection.user;
  return (
    <Card className="flex items-center gap-3 p-4">
      <Avatar src={u.avatar} name={u.name} size="lg" />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name}</p><p className="truncate text-sm text-muted">{[u.headline, u.company].filter(Boolean).join(' · ') || u.email}</p></div>
      <div className="flex shrink-0 gap-1">
        <Link to={`/participant/chat/${u.id}`}><Button size="sm"><MessageCircle className="h-3.5 w-3.5" />Message</Button></Link>
        <Button size="icon" variant="ghost" aria-label={`Remove ${u.name}`} onClick={onRemove}><UserMinus className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label={`Block ${u.name}`} onClick={onBlock}><Ban className="h-4 w-4 text-danger" /></Button>
      </div>
    </Card>
  );
}
