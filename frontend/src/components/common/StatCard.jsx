import { Card } from '@/components/ui/card';
export function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      {Icon && <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" aria-hidden /></div>}
      <div className="min-w-0"><p className="truncate text-sm text-muted">{label}</p><p className="text-2xl font-bold tracking-tight">{value}</p>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
    </Card>
  );
}
