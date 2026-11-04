import { cn } from '@/utils/cn';
const tones = {
  neutral: 'bg-muted-bg text-muted', primary: 'bg-primary/10 text-primary', accent: 'bg-accent/10 text-accent', purple: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger',
};
export const Badge = ({ tone = 'neutral', className, ...p }) => <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', tones[tone], className)} {...p} />;

const STATUS_TONE = { published: 'success', approved: 'success', active: 'success', accepted: 'success', present: 'success', answered: 'accent', completed: 'accent', registered: 'primary', pending: 'warning', draft: 'neutral', cancelled: 'danger', rejected: 'danger', blocked: 'danger', inactive: 'danger', absent: 'danger', pinned: 'purple' };
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[String(status).toLowerCase()] || 'neutral'}>{status}</Badge>;
