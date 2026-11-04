import { describe, it, expect } from 'vitest';
import { deriveAnalytics, formatStat } from './analyticsAdapter';

describe('deriveAnalytics', () => {
  it('turns scalars into stats and object arrays into charts', () => {
    const r = deriveAnalytics({ totalRegistrations: 120, attendanceRate: 0.75, monthlyRegistrations: [{ month: 'Jan', count: 10 }, { month: 'Feb', count: 25 }] });
    expect(r.stats).toHaveLength(2);
    expect(r.stats[1].value).toBe('75%');
    expect(r.charts).toHaveLength(1);
    expect(r.charts[0].variant).toBe('line');
    expect(r.charts[0].rows[1]).toEqual({ label: 'Feb', count: 25 });
  });
  it('charts all-numeric objects and flattens summaries', () => {
    const r = deriveAnalytics({ summary: { users: 5, events: 3, sessions: 9 }, attendance: { present: 40, absent: 10, late: 2 } });
    expect(r.stats.map((s) => s.label)).toEqual(['Users', 'Events', 'Sessions']);
    expect(r.charts[0].rows).toHaveLength(3);
  });
  it('is safe on empty or odd input', () => {
    expect(deriveAnalytics(null)).toEqual({ stats: [], charts: [], unknown: [] });
    expect(deriveAnalytics({ x: 'text', y: [] }).charts).toHaveLength(0);
  });
  it('formats stats', () => { expect(formatStat('total', 1200)).toBe((1200).toLocaleString()); });
});
