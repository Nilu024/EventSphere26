import { cn } from '@/utils/cn';
/** Toggleable skill chips used to filter recommendations (client-side, on the data the backend returned). */
export function SkillSelector({ skills, selected, onToggle }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
      {skills.map((s) => (
        <button key={s} type="button" aria-pressed={selected.includes(s)} onClick={() => onToggle(s)}
          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', selected.includes(s) ? 'border-accent bg-accent text-white' : 'border-border bg-card text-muted hover:text-foreground')}>{s}</button>
      ))}
    </div>
  );
}
