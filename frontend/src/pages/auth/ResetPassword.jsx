import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { authService } from '@/services/authService';
import { resetSchema } from '@/utils/validators';
import { getErrorMessage } from '@/services/adapters';

/** ASSUMPTION: the emailed link carries the reset token as `?token=…` (backend email template not documented). */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetSchema) });
  const onSubmit = async (v) => {
    setFormError('');
    try { await authService.resetPassword({ token, password: v.password }); toast.success('Password updated. Please sign in.'); navigate('/login', { replace: true }); }
    catch (e) { setFormError(getErrorMessage(e, 'This reset link is invalid or has expired.')); }
  };
  if (!token) return (<div className="text-center"><h1 className="text-2xl font-bold">Invalid reset link</h1><p className="mt-2 text-sm text-muted">The link is missing its token. Request a new one.</p><Link to="/forgot-password"><Button className="mt-6">Request new link</Button></Link></div>);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</div>}
        <Field label="New password" error={errors.password}>{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('password')} />}</Field>
        <Field label="Confirm password" error={errors.confirmPassword}>{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('confirmPassword')} />}</Field>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Update password</Button>
      </form>
    </div>
  );
}
