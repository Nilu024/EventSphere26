import { cn } from '@/utils/cn';
export function DataTable({ columns, rows, rowKey = (r) => r.id }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted-bg/60 text-xs uppercase tracking-wide text-muted">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={cn('px-4 py-3 font-medium', c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (<tr key={rowKey(r)} className="hover:bg-muted-bg/40">{columns.map((c) => <td key={c.key} className={cn('px-4 py-3 align-middle', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>))}
        </tbody>
      </table>
    </div>
  );
}
