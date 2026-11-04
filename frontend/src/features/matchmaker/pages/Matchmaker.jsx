import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { QueryState } from '@/components/common/States';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MatchCard } from '../components/MatchCard';
import { MatchPercentage } from '../components/MatchPercentage';
import { SkillSelector } from '../components/SkillSelector';
import { matchService } from '../matchService';
import { useConnectionMutations, useRecommendations } from '@/hooks/useSocial';
import { matchView } from '@/utils/fields';

function ProfileModal({ match, onClose, onConnect, sent }) {
  // Optional detail fetch (GET /networking/recommendations/{userId}); falls back to the card data.
  const detail = useQuery({ queryKey: ['recommendation', match?.id], queryFn: () => matchService.forUser(match.id), enabled: Boolean(match?.id), select: matchView, retry: false });
  const m = match && { ...match, ...(detail.data?.id ? Object.fromEntries(Object.entries(detail.data).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))) : {}) };
  return (
    <Modal open={Boolean(match)} onClose={onClose} title="Professional profile" footer={m && <><Button variant="outline" onClick={onClose}>Close</Button>{!sent && <Button onClick={() => onConnect(m.id)}>Send connection request</Button>}</>}>
      {m && (<div className="space-y-4">
        <div className="flex items-center gap-4"><Avatar src={m.avatar} name={m.name} size="xl" /><div className="flex-1"><h3 className="text-lg font-semibold">{m.name}</h3><p className="text-sm text-muted">{[m.headline, m.company].filter(Boolean).join(' · ')}</p>{m.location && <p className="text-xs text-muted">{m.location}</p>}</div><MatchPercentage value={m.score} /></div>
        {m.bio && <p className="text-sm leading-relaxed">{m.bio}</p>}
        {m.skills.length > 0 && <div><p className="mb-1.5 text-sm font-medium">Skills</p><div className="flex flex-wrap gap-1.5">{m.skills.map((s) => <Badge key={s} tone="primary" className="normal-case">{s}</Badge>)}</div></div>}
        {m.interests.length > 0 && <div><p className="mb-1.5 text-sm font-medium">Interests</p><div className="flex flex-wrap gap-1.5">{m.interests.map((s) => <Badge key={s} tone="accent" className="normal-case">{s}</Badge>)}</div></div>}
        {m.commonSkills.length > 0 && <div><p className="mb-1.5 text-sm font-medium text-success">Skills you share</p><div className="flex flex-wrap gap-1.5">{m.commonSkills.map((s) => <Badge key={s} tone="success" className="normal-case">{s}</Badge>)}</div></div>}
      </div>)}
    </Modal>
  );
}

export default function Matchmaker() {
  const q = useRecommendations();
  const { send } = useConnectionMutations();
  const [search, setSearch] = useState(''); const [skills, setSkills] = useState([]); const [sent, setSent] = useState(() => new Set()); const [view, setView] = useState(null);

  const allSkills = useMemo(() => [...new Set((q.data || []).flatMap((m) => m.skills))].slice(0, 24), [q.data]);
  const items = (q.data || []).filter((m) => {
    const hay = [m.name, m.headline, m.company, ...m.skills, ...m.interests].join(' ').toLowerCase();
    return hay.includes(search.toLowerCase()) && skills.every((s) => m.skills.includes(s));
  });
  const connect = (id) => send.mutate({ userId: id }, { onSuccess: () => setSent((s) => new Set(s).add(id)) });

  return (
    <>
      <PageHeader title="Smart matchmaker" description="People you should meet, ranked by the backend using skills and interests." />
      <div className="mb-6 space-y-3">
        <SearchBar className="max-w-md" value={search} onChange={setSearch} placeholder="Search name, company, skill…" />
        <SkillSelector skills={allSkills} selected={skills} onToggle={(s) => setSkills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))} />
      </div>
      <QueryState query={q} items={items} empty={{ icon: Sparkles, title: q.data?.length ? 'No matches for these filters' : 'No recommendations yet', description: q.data?.length ? 'Clear a filter to see more people.' : 'Add skills and interests to your profile to get better matches.' }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => <MatchCard key={m.id} match={m} sent={sent.has(m.id)} connecting={send.isPending && send.variables?.userId === m.id} onConnect={() => connect(m.id)} onView={() => setView(m)} />)}
        </div>
      </QueryState>
      <ProfileModal match={view} onClose={() => setView(null)} sent={view && sent.has(view.id)} onConnect={connect} />
    </>
  );
}
