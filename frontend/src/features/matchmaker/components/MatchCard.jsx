import { Building2, MapPin, UserPlus, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MatchPercentage } from './MatchPercentage';

export function MatchCard({ match, onConnect, onView, sent, connecting }) {
  const common = new Set([...match.commonSkills, ...match.commonInterests].map((s) => s.toLowerCase()));
  const Chip = ({ s, tone }) => <Badge tone={common.has(s.toLowerCase()) ? 'success' : tone} className="normal-case">{s}</Badge>;
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <Avatar src={match.avatar} name={match.name} size="lg" />
        <div className="min-w-0 flex-1">
          <button onClick={onView} className="truncate text-left font-semibold hover:text-accent">{match.name}</button>
          {match.headline && <p className="truncate text-sm text-muted">{match.headline}</p>}
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
            {match.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{match.company}</span>}
            {match.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.location}</span>}
          </div>
        </div>
        <MatchPercentage value={match.score} />
      </div>
      {match.skills.length > 0 && <div><p className="mb-1.5 text-xs font-medium text-muted">Skills</p><div className="flex flex-wrap gap-1.5">{match.skills.slice(0, 6).map((s) => <Chip key={s} s={s} tone="primary" />)}</div></div>}
      {match.interests.length > 0 && <div><p className="mb-1.5 text-xs font-medium text-muted">Interests</p><div className="flex flex-wrap gap-1.5">{match.interests.slice(0, 5).map((s) => <Chip key={s} s={s} tone="accent" />)}</div></div>}
      {common.size > 0 && <p className="text-xs text-success">Highlighted items are shared with you.</p>}
      <div className="mt-auto flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onView}>View profile</Button>
        {sent ? <Button size="sm" className="flex-1" variant="subtle" disabled><Check className="h-3.5 w-3.5" />Requested</Button>
          : <Button size="sm" className="flex-1" loading={connecting} onClick={onConnect}><UserPlus className="h-3.5 w-3.5" />Connect</Button>}
      </div>
    </Card>
  );
}
