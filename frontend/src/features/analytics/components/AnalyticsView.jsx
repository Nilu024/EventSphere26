import { BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeriesChart } from './SeriesChart';
import { deriveAnalytics } from '../analyticsAdapter';

export function AnalyticsView({ data }) {
  const { stats, charts } = deriveAnalytics(data);
  if (!stats.length && !charts.length) return <EmptyState icon={BarChart3} title="No analytics data yet" description="Data appears once there is activity to report." />;
  return (
    <div className="space-y-6">
      {stats.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map((s) => <StatCard key={s.key} label={s.label} value={s.value} icon={BarChart3} />)}</div>}
      {charts.length > 0 && <div className="grid gap-6 lg:grid-cols-2">{charts.map((c) => (
        <Card key={c.key}><CardHeader><CardTitle>{c.title}</CardTitle></CardHeader><CardContent><SeriesChart rows={c.rows} series={c.series} variant={c.variant} labels={c.labels} /></CardContent></Card>))}</div>}
    </div>
  );
}
