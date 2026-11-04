import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/utils/validators';
import { getErrorMessage } from '@/services/adapters';
import { homeFor } from '@/routes/routeConfig';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const user = await login(values);
      if (!user) { setFormError('Signed in, but the session could not be read. Check cookie/CORS settings (see README).'); return; }
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      navigate(from && from.startsWith(`/${user.role}`) ? from : homeFor(user.role?.toLowerCase()), { replace: true });
    } catch (e) { setFormError(getErrorMessage(e, 'Invalid email or password')); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to continue to EventSphere.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</div>}
        <Field label="Email" error={errors.email}>{(p) => <Input type="email" autoComplete="email" placeholder="you@company.com" {...p} {...register('email')} />}</Field>
        <Field label="Password" error={errors.password}>
          {(p) => (<div className="relative"><Input type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-10" {...p} {...register('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>)}
        </Field>
        <div className="text-right"><Link to="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</Link></div>
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to EventSphere? <Link to="/register" className="font-medium text-accent hover:underline">Create an account</Link></p>
    </div>
  );
}
