import { cn } from '@/utils/cn';
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto rounded-xl bg-muted-bg p-1', className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors', value === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
          {t.icon}{t.label}{t.count !== undefined && <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
