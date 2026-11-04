import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { messageSchema } from '@/utils/validators';

export function ChatInput({ onSend, sending }) {
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(messageSchema), defaultValues: { content: '' } });
  const submit = ({ content }) => onSend(content, () => reset());
  return (
    <form onSubmit={handleSubmit(submit)} className="flex gap-2 border-t border-border p-3">
      <Input autoComplete="off" placeholder="Write a message…" aria-label="Message" {...register('content')} />
      <Button type="submit" loading={sending} aria-label="Send message"><Send className="h-4 w-4" /></Button>
    </form>
  );
}
