import { Select } from '@/components/ui/form';
import { useManageableEvents } from '@/hooks/useEvents';

/** Dropdown of events the user can manage. `events` can be supplied to override (e.g. registered events). */
export function EventPicker({ value, onChange, events, label = 'Select an event' }) {
  const q = useManageableEvents(!events);
  const list = events || q.items;
  return (
    <Select value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={label} className="max-w-md">
      <option value="">{q.isLoading && !events ? 'Loading events…' : label}</option>
      {list.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
    </Select>
  );
}
