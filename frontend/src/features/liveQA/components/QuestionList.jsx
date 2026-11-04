import { useState } from 'react';
import { MessageSquareDashed } from 'lucide-react';
import { QueryState } from '@/components/common/States';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/form';
import { QuestionCard } from './QuestionCard';

export function QuestionList({ query, canModerate, mutations }) {
  const [sort, setSort] = useState('top'); const [filter, setFilter] = useState('all');
  const all = query.data || [];
  const items = all.filter((q) => filter === 'all' || q.status === filter)
    .sort((a, b) => (sort === 'top' ? b.votes - a.votes : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  const counts = (s) => all.filter((q) => q.status === s).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'all', label: 'All', count: all.length }, { value: 'pending', label: 'Pending', count: counts('pending') }, { value: 'approved', label: 'Approved', count: counts('approved') }, { value: 'answered', label: 'Answered', count: counts('answered') }]} />
        <Select className="w-40" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort questions"><option value="top">Most upvoted</option><option value="new">Newest</option></Select>
      </div>
      <QueryState query={query} items={items} skeleton="rows" empty={{ icon: MessageSquareDashed, title: 'No questions here', description: 'Be the first to ask something.' }}>
        <div className="space-y-3" aria-live="polite">{items.map((q) => (
          <QuestionCard key={q.id} question={q} canModerate={canModerate}
            voting={(mutations.upvote.isPending && mutations.upvote.variables === q.id) || (mutations.removeUpvote.isPending && mutations.removeUpvote.variables === q.id)}
            moderating={mutations.moderate.isPending && mutations.moderate.variables?.id === q.id}
            onToggleUpvote={() => (q.hasUpvoted ? mutations.removeUpvote.mutate(q.id) : mutations.upvote.mutate(q.id))}
            onModerate={(status) => mutations.moderate.mutate({ id: q.id, status })} />))}</div>
      </QueryState>
    </div>
  );
}
