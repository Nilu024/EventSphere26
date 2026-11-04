import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { useEvent, useEventMutations } from '@/hooks/useEvents';
import { eventSchema } from '@/utils/validators';
import { toInputDateTime } from '@/utils/formatDate';
import { idOf, eventView } from '@/utils/fields';

function Form({ event }) {
  const navigate = useNavigate();
  const m = useEventMutations();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(eventSchema), defaultValues: { title: '', description: '', startDate: '', endDate: '', category: '', location: '', capacity: '' } });
  useEffect(() => {
    if (event) reset({ title: event.title, description: event.description, startDate: toInputDateTime(event.start), endDate: toInputDateTime(event.end), category: event.category || '', location: typeof event.location === 'string' ? event.location : '', capacity: event.capacity ? String(event.capacity) : '' });
  }, [event, reset]);

  const onSubmit = (values) => {
    if (event) return m.update.mutate({ id: event.id, values }, { onSuccess: () => navigate(`/organizer/events/${event.id}`) });
    return m.create.mutate(values, { onSuccess: (created) => { const id = idOf(eventView(created)); navigate(id ? `/organizer/events/${id}` : '/organizer/events'); } });
  };
  return (
    <Card className="max-w-3xl"><CardContent className="pt-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field className="sm:col-span-2" label="Title" error={errors.title}>{(p) => <Input {...p} {...register('title')} />}</Field>
        <Field className="sm:col-span-2" label="Description" error={errors.description}>{(p) => <Textarea rows={5} {...p} {...register('description')} />}</Field>
        <Field label="Starts" error={errors.startDate}>{(p) => <Input type="datetime-local" {...p} {...register('startDate')} />}</Field>
        <Field label="Ends" error={errors.endDate}>{(p) => <Input type="datetime-local" {...p} {...register('endDate')} />}</Field>
        <Field label="Category" error={errors.category}>{(p) => <Input placeholder="e.g. Technology" {...p} {...register('category')} />}</Field>
        <Field label="Capacity" error={errors.capacity}>{(p) => <Input inputMode="numeric" placeholder="Optional" {...p} {...register('capacity')} />}</Field>
        <Field className="sm:col-span-2" label="Location / platform" error={errors.location}>{(p) => <Input placeholder="Online" {...p} {...register('location')} />}</Field>
        {event && <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Banner</p><ImageUpload label="Upload banner" loading={m.banner.isPending} onUpload={(file) => m.banner.mutate({ id: event.id, file })} /></div>}
        {!event && <p className="sm:col-span-2 text-xs text-muted">Events start as drafts. You can upload a banner, add sessions and speakers, then publish.</p>}
        <div className="sm:col-span-2 flex justify-end gap-2"><Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button><Button type="submit" loading={m.create.isPending || m.update.isPending}>{event ? 'Save changes' : 'Create event'}</Button></div>
      </form>
    </CardContent></Card>
  );
}

export default function EventForm() {
  const { eventId } = useParams();
  const q = useEvent(eventId);
  return (
    <>
      <PageHeader title={eventId ? 'Edit event' : 'Create event'} description={eventId ? 'Update event details.' : 'Describe your event. You can add sessions and speakers next.'} />
      {eventId ? <QueryState query={q} skeleton="block">{q.data && <Form event={q.data} />}</QueryState> : <Form />}
    </>
  );
}
