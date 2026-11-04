import { humanize } from '@/utils/fields';
import { formatDateTime } from '@/utils/formatDate';
const isDate = (k, v) => /(at|date|time)$/i.test(k) && typeof v === 'string' && !Number.isNaN(Date.parse(v));
/** Renders unknown-shape objects safely (used where the backend response is undocumented). */
export function KeyValueList({ data }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v !== null && typeof v !== 'object' || Array.isArray(v));
  if (!entries.length) return <p className="text-sm text-muted">No details available.</p>;
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([k, v]) => (<div key={k}><dt className="text-xs uppercase tracking-wide text-muted">{humanize(k)}</dt><dd className="text-sm font-medium">{isDate(k, v) ? formatDateTime(v) : Array.isArray(v) ? v.length : String(v)}</dd></div>))}
    </dl>
  );
}
