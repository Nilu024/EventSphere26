export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">About EventSphere</h1>
      <p className="mt-4 text-muted">EventSphere is a virtual event management and professional networking platform. It connects participants through skill-based recommendations, virtual meetings, live discussions and lasting professional connections.</p>
      <h2 className="mt-10 text-xl font-semibold">Who it is for</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
        <li><strong className="text-foreground">Participants</strong> manage a professional profile, register for events and network.</li>
        <li><strong className="text-foreground">Organizers</strong> run events, sessions, speakers, attendance and Q&A.</li>
        <li><strong className="text-foreground">Admins</strong> manage users, events and platform analytics.</li>
      </ul>
      <p className="mt-10 text-sm text-muted">Built as a CDAC final project. EventSphere – Connect. Collaborate. Grow.</p>
    </div>
  );
}
