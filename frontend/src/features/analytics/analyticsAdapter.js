import { humanize } from '@/utils/fields';

/**
 * The analytics response shape is undocumented, so this adapter derives widgets from whatever the
 * backend returns instead of assuming field names:
 *  • top-level numbers, and objects named like overview/summary/totals → stat cards
 *  • objects whose values are all numbers → bar chart of entries (e.g. { attended: 40, absent: 10 })
 *  • arrays of objects → chart (line for time-like data, bar otherwise)
 */
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isNumLike = (v) => isNum(v) || (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)));
const TIME_RE = /(month|date|day|week|year|time|trend|over)/i;
const SUMMARY_RE = /(overview|summary|totals?|stats|statistics|metrics|counts?)/i;
const LABEL_KEYS = ['label', 'name', 'month', 'date', 'title', 'event', 'eventTitle', 'category', 'day', 'week', 'status'];

export const formatStat = (key, value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (/(percent|rate|ratio)/i.test(key)) return `${Math.round(n * (n <= 1 && n > 0 ? 100 : 1) * 10) / 10}%`;
  return n.toLocaleString();
};

const labelOf = (row, labelKey) => {
  const v = row[labelKey];
  return v && typeof v === 'object' ? (v.name ?? v.title ?? JSON.stringify(v)) : String(v ?? '');
};

export function deriveAnalytics(data) {
  const stats = []; const charts = []; const unknown = [];
  if (!data || typeof data !== 'object') return { stats, charts, unknown };
  const root = Array.isArray(data) ? { items: data } : data;

  Object.entries(root).forEach(([key, value]) => {
    if (isNumLike(value) && typeof value !== 'boolean') { stats.push({ key, label: humanize(key), value: formatStat(key, value) }); return; }
    if (Array.isArray(value)) {
      const objs = value.filter((r) => r && typeof r === 'object');
      if (!objs.length) return;
      const sample = objs[0];
      const labelKey = LABEL_KEYS.find((k) => k in sample) || Object.keys(sample).find((k) => !isNumLike(sample[k])) || '_id';
      const series = Object.keys(sample).filter((k) => k !== labelKey && isNumLike(sample[k]) && k !== '_id' && k !== 'id');
      if (!series.length) { unknown.push(key); return; }
      const rows = objs.map((r) => ({ label: labelOf(r, labelKey), ...Object.fromEntries(series.map((s) => [s, Number(r[s])])) }));
      charts.push({ key, title: humanize(key), rows, series, labels: Object.fromEntries(series.map((s) => [s, humanize(s)])), variant: TIME_RE.test(key) || TIME_RE.test(labelKey) ? 'line' : 'bar' });
      return;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      const numeric = entries.filter(([, v]) => isNumLike(v));
      if (!numeric.length) { unknown.push(key); return; }
      if (SUMMARY_RE.test(key) || numeric.length <= 2) { numeric.forEach(([k, v]) => stats.push({ key: `${key}.${k}`, label: humanize(k), value: formatStat(k, v) })); return; }
      charts.push({ key, title: humanize(key), rows: numeric.map(([k, v]) => ({ label: humanize(k), value: Number(v) })), series: ['value'], labels: { value: humanize(key) }, variant: 'bar' });
    }
  });
  return { stats, charts, unknown };
}
