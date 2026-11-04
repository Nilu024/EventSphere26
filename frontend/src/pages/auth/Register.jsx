import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema } from '@/utils/validators';
import { getErrorMessage } from '@/services/adapters';
import { homeFor } from '@/routes/routeConfig';
import { PUBLIC_ROLES } from '@/utils/constants';

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'participant' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const user = await signUp(values);
      if (user) { toast.success('Account created!'); navigate(homeFor(user.role?.toLowerCase()), { replace: true }); }
      else { toast.success('Account created. Please sign in.'); navigate('/login', { replace: true }); }
    } catch (e) { setFormError(getErrorMessage(e, 'Registration failed')); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Join events and grow your professional network.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</div>}
        <Field label="Full name" error={errors.name}>{(p) => <Input autoComplete="name" {...p} {...register('name')} />}</Field>
        <Field label="Email" error={errors.email}>{(p) => <Input type="email" autoComplete="email" {...p} {...register('email')} />}</Field>
        <Field label="I am joining as" error={errors.role} hint="Admin accounts cannot be created here.">
          {(p) => <Select {...p} {...register('role')}>{PUBLIC_ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}</Select>}
        </Field>
        <Field label="Password" error={errors.password} hint="8+ characters with a letter and a number.">{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('password')} />}</Field>
        <Field label="Confirm password" error={errors.confirmPassword}>{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('confirmPassword')} />}</Field>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already registered? <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link></p>
    </div>
  );
}
