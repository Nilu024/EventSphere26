import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { authService } from '@/services/authService';
import { forgotSchema } from '@/utils/validators';
import { getErrorMessage } from '@/services/adapters';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema) });
  const onSubmit = async (v) => { setFormError(''); try { await authService.forgotPassword(v); setSent(true); } catch (e) { setFormError(getErrorMessage(e)); } };

  if (sent) return (
    <div className="text-center"><MailCheck className="mx-auto h-10 w-10 text-success" /><h1 className="mt-4 text-2xl font-bold">Check your email</h1>
      <p className="mt-2 text-sm text-muted">If an account exists for that address, a password reset link is on its way.</p>
      <Link to="/login"><Button variant="outline" className="mt-6">Back to sign in</Button></Link></div>
  );
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
      <p className="mt-1 text-sm text-muted">Enter your email and we will send a reset link.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</div>}
        <Field label="Email" error={errors.email}>{(p) => <Input type="email" autoComplete="email" {...p} {...register('email')} />}</Field>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/login" className="text-accent hover:underline">Back to sign in</Link></p>
    </div>
  );
}
