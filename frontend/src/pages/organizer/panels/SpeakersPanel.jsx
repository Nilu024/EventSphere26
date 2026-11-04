import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mic2, Pencil, Plus, Trash2 } from 'lucide-react';
import { QueryState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Textarea } from '@/components/ui/form';
import { useSpeakerMutations, useSpeakers } from '@/hooks/useEvents';
import { speakerSchema } from '@/utils/validators';

function SpeakerForm({ eventId, speaker, onClose }) {
  const m = useSpeakerMutations(eventId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(speakerSchema) });
  useEffect(() => { reset(speaker ? { name: speaker.name, designation: speaker.designation || '', company: speaker.company || '', bio: speaker.bio } : { name: '', designation: '', company: '', bio: '' }); }, [speaker, reset]);
  const onSubmit = (values) => (speaker ? m.update.mutate({ id: speaker.id, values }, { onSuccess: onClose }) : m.create.mutate(values, { onSuccess: onClose }));
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Name" error={errors.name}>{(p) => <Input {...p} {...register('name')} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Designation" error={errors.designation}>{(p) => <Input {...p} {...register('designation')} />}</Field>
        <Field label="Company" error={errors.company}>{(p) => <Input {...p} {...register('company')} />}</Field>
      </div>
      <Field label="Bio" error={errors.bio}>{(p) => <Textarea {...p} {...register('bio')} />}</Field>
      {speaker && <div><p className="mb-2 text-sm font-medium">Photo</p><ImageUpload label="Upload photo" loading={m.image.isPending} onUpload={(file) => m.image.mutate({ id: speaker.id, file })} /></div>}
      {!speaker && <p className="text-xs text-muted">You can upload a photo after the speaker has been created.</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button type="submit" loading={m.create.isPending || m.update.isPending}>{speaker ? 'Save speaker' : 'Add speaker'}</Button></div>
    </form>
  );
}

export default function SpeakersPanel({ eventId }) {
  const q = useSpeakers(eventId); const m = useSpeakerMutations(eventId);
  const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false); const [del, setDel] = useState(null);
  const close = () => { setOpen(false); setEditing(null); };
  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add speaker</Button></div>
      <QueryState query={q} items={q.data} skeleton="rows" empty={{ icon: Mic2, title: 'No speakers yet', description: 'Add the speakers presenting at this event.' }}>
        <div className="grid gap-3 sm:grid-cols-2">{q.data?.map((s) => (
          <Card key={s.id} className="flex items-center gap-3 p-4">
            <Avatar src={s.image} name={s.name} size="lg" />
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{s.name}</p><p className="truncate text-xs text-muted">{[s.designation, s.company].filter(Boolean).join(' · ')}</p></div>
            <Button size="icon" variant="ghost" aria-label="Edit speaker" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Remove speaker" onClick={() => setDel(s)}><Trash2 className="h-4 w-4 text-danger" /></Button>
          </Card>))}</div>
      </QueryState>
      <Modal open={open} onClose={close} title={editing ? 'Edit speaker' : 'Add speaker'}><SpeakerForm eventId={eventId} speaker={editing} onClose={close} /></Modal>
      <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} danger title={`Remove ${del?.name}?`} confirmLabel="Remove" loading={m.remove.isPending} onConfirm={() => m.remove.mutate(del.id, { onSuccess: () => setDel(null) })} />
    </>
  );
}
