import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['var(--accent)', 'var(--secondary)', 'var(--primary)', 'var(--success)', 'var(--warning)'];
const axis = { stroke: 'var(--muted)', fontSize: 12, tickLine: false, axisLine: false };

/** Generic bar/line chart. `rows` = [{label, a, b…}], `series` = ['a','b'] keys, `variant` = 'bar' | 'line'. */
export function SeriesChart({ rows, series, variant = 'bar', labels = {} }) {
  const common = { data: rows, margin: { top: 8, right: 12, left: -12, bottom: 0 } };
  const tooltip = <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }} cursor={{ fill: 'var(--muted-bg)', opacity: 0.5 }} />;
  return (
    <div className="h-72 w-full" role="img" aria-label="Chart">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'line' ? (
          <LineChart {...common}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} allowDecimals={false} />{tooltip}{series.length > 1 && <Legend />}
            {series.map((k, i) => <Line key={k} type="monotone" dataKey={k} name={labels[k] || k} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />)}</LineChart>
        ) : (
          <BarChart {...common}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} allowDecimals={false} />{tooltip}{series.length > 1 && <Legend />}
            {series.map((k, i) => <Bar key={k} dataKey={k} name={labels[k] || k} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />)}</BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
