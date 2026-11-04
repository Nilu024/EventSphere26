import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/States';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Field, Input, Textarea } from '@/components/ui/form';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useAuth } from '@/hooks/useAuth';
import { SK } from '@/hooks/useSocial';
import { userView } from '@/utils/fields';
import { profileSchema, changePasswordSchema } from '@/utils/validators';
import { getErrorMessage } from '@/services/adapters';

function ProfileForm({ profile }) {
  const { refreshUser, role } = useAuth();
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm({ resolver: zodResolver(profileSchema) });
  useEffect(() => {
    reset({ name: profile.name, headline: profile.headline || '', company: profile.company || '', location: profile.location || '', bio: profile.bio || '', skills: profile.skills.join(', '), interests: profile.interests.join(', ') });
  }, [profile, reset]);
  const save = useApiMutation(userService.updateMe, { success: 'Profile saved', invalidate: [SK.me], onSuccess: refreshUser });
  const avatar = useApiMutation(userService.uploadAvatar, { success: 'Profile picture updated', invalidate: [SK.me], onSuccess: refreshUser });
  const chips = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const showNetworking = role === 'participant';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="h-fit lg:col-span-1">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <Avatar src={profile.avatar} name={profile.name} size="xl" />
          <div><p className="text-lg font-semibold">{profile.name}</p><p className="text-sm text-muted">{profile.email}</p></div>
          <Badge tone="purple">{profile.role}</Badge>
          <ImageUpload label="Change picture" loading={avatar.isPending} onUpload={(f) => avatar.mutate(f)} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Professional profile</CardTitle><CardDescription>{showNetworking ? 'Skills and interests power your networking recommendations.' : 'Keep your details up to date.'}</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Full name" error={errors.name}>{(p) => <Input {...p} {...register('name')} />}</Field>
            <Field label="Headline" error={errors.headline}>{(p) => <Input placeholder="e.g. Full-stack developer" {...p} {...register('headline')} />}</Field>
            <Field label="Company" error={errors.company}>{(p) => <Input {...p} {...register('company')} />}</Field>
            <Field label="Location" error={errors.location}>{(p) => <Input {...p} {...register('location')} />}</Field>
            <Field className="sm:col-span-2" label="Bio" error={errors.bio}>{(p) => <Textarea {...p} {...register('bio')} />}</Field>
            <Field className="sm:col-span-2" label="Skills" hint="Comma separated" error={errors.skills}>{(p) => <Input placeholder="React, Node.js, Product design" {...p} {...register('skills')} />}</Field>
            <div className="sm:col-span-2 flex flex-wrap gap-1.5">{chips(watch('skills')).map((s) => <Badge key={s} tone="primary">{s}</Badge>)}</div>
            <Field className="sm:col-span-2" label="Interests" hint="Comma separated" error={errors.interests}>{(p) => <Input placeholder="AI, Startups, Web3" {...p} {...register('interests')} />}</Field>
            <div className="sm:col-span-2 flex flex-wrap gap-1.5">{chips(watch('interests')).map((s) => <Badge key={s} tone="accent">{s}</Badge>)}</div>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={save.isPending} disabled={!isDirty}>Save changes</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(changePasswordSchema) });
  const onSubmit = async (v) => {
    try { await authService.changePassword(v); toast.success('Password changed'); reset(); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Change password</CardTitle><CardDescription>Use a strong password you do not use elsewhere.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Current password" error={errors.currentPassword}>{(p) => <Input type="password" autoComplete="current-password" {...p} {...register('currentPassword')} />}</Field>
          <Field label="New password" error={errors.newPassword}>{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('newPassword')} />}</Field>
          <Field label="Confirm new password" error={errors.confirmPassword}>{(p) => <Input type="password" autoComplete="new-password" {...p} {...register('confirmPassword')} />}</Field>
          <Button type="submit" loading={isSubmitting}>Update password</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const [tab, setTab] = useState('profile');
  const q = useQuery({ queryKey: SK.me, queryFn: userService.getMe, select: userView });
  return (
    <>
      <PageHeader title="Profile & settings" description="Manage how you appear on EventSphere." />
      <Tabs className="mb-6 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'profile', label: 'Profile' }, { value: 'security', label: 'Security' }]} />
      {tab === 'profile' ? <QueryState query={q} skeleton="block">{q.data && <ProfileForm profile={q.data} />}</QueryState> : <PasswordForm />}
    </>
  );
}
