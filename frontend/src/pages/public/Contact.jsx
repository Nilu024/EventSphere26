import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** No contact endpoint is documented, so this page does not pretend to submit a form. */
export default function Contact() {
  const email = import.meta.env.VITE_CONTACT_EMAIL;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary"><Mail className="h-6 w-6" /></div>
      <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
      <p className="mt-3 text-muted">Questions about EventSphere, events or your account? Reach out by email.</p>
      <div className="mt-6">
        {email
          ? <a href={`mailto:${email}`}><Button size="lg">{email}</Button></a>
          : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No contact email is configured. Set <code>VITE_CONTACT_EMAIL</code> in your <code>.env</code> file.</p>}
      </div>
    </div>
  );
}
