import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';
import { questionSchema } from '@/utils/validators';

export function QuestionForm({ onSubmit, loading }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: zodResolver(questionSchema), defaultValues: { content: '' } });
  const len = (watch('content') || '').length;
  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v, () => reset()))} className="space-y-3" noValidate>
      <Field label="Ask a question" error={errors.content} hint={`${len}/500`}>{(p) => <Textarea rows={3} placeholder="What would you like to ask the speakers?" {...p} {...register('content')} />}</Field>
      <div className="flex justify-end"><Button type="submit" loading={loading}><Send className="h-4 w-4" />Submit question</Button></div>
    </form>
  );
}
