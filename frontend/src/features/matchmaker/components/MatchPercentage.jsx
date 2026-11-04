/** Rendered ONLY when the backend supplies a score (no frontend-invented compatibility numbers). */
export function MatchPercentage({ value }) {
  if (value === undefined || value === null) return null;
  const tone = value >= 80 ? 'text-success' : value >= 50 ? 'text-accent' : 'text-warning';
  return (
    <div className="flex flex-col items-center" aria-label={`${value} percent match`}>
      <span className={`text-xl font-bold leading-none ${tone}`}>{value}%</span>
      <span className="text-[10px] uppercase tracking-wide text-muted">match</span>
    </div>
  );
}
