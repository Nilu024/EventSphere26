import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, MessagesSquare, Sparkles, UserPlus, Video, CalendarCheck, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  { icon: Sparkles, title: 'Smart Networking Matchmaker', text: 'Skill- and interest-based recommendations so you meet the right people, not just more people.' },
  { icon: Video, title: 'Virtual Speed Networking', text: 'Join a queue, get matched, and talk face to face in short, focused video meetings.' },
  { icon: MessagesSquare, title: 'Live Q&A', text: 'Ask, upvote and moderate questions in real time during every session.' },
  { icon: UserPlus, title: 'Connection Hub & Chat', text: 'Turn conversations into a professional network with requests and private messaging.' },
  { icon: BarChart3, title: 'Analytics Dashboard', text: 'Registrations, attendance and engagement at a glance for organizers and admins.' },
  { icon: CalendarCheck, title: 'End-to-end event tools', text: 'Sessions, speakers, registrations and attendance in one organized workspace.' },
];

export default function Landing() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,color-mix(in_srgb,var(--secondary)_18%,transparent),transparent)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Virtual events · Professional networking</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">Events that turn attendees into <span className="text-secondary">connections</span>.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">EventSphere combines event management with intelligent matchmaking, speed networking, live Q&A and private chat.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button size="lg">Create free account <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="relative">
            <Card className="overflow-hidden p-0 shadow-xl">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3"><span className="h-2.5 w-2.5 rounded-full bg-danger/70" /><span className="h-2.5 w-2.5 rounded-full bg-warning/70" /><span className="h-2.5 w-2.5 rounded-full bg-success/70" /></div>
              <div className="grid gap-3 p-5">
                {['Priya S. · 92% match', 'Marcus L. · 87% match', 'Aiko T. · 81% match'].map((t, i) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary" style={{ opacity: 1 - i * 0.15 }} />
                    <div className="flex-1"><p className="text-sm font-semibold">{t.split(' · ')[0]}</p><p className="text-xs text-muted">{t.split(' · ')[1]}</p></div>
                    <span className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white">Connect</span>
                  </div>
                ))}
                <p className="text-center text-[11px] text-muted">Illustrative preview – not real data</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center"><h2 className="text-3xl font-bold tracking-tight">Everything for a connected event</h2><p className="mt-3 text-muted">Five core experiences, built for participants, organizers and admins.</p></div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-6 transition-shadow hover:shadow-md"><div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" aria-hidden /></div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-muted">{text}</p></Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[['Participants', 'Discover events, build a profile, get matched and chat with your connections.'], ['Organizers', 'Create events, manage sessions and speakers, track attendance, moderate Q&A.'], ['Admins', 'Oversee users, organizers and events with platform-wide analytics.']].map(([t, d]) => (
            <div key={t}><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-accent" />{t}</h3><p className="mt-2 text-sm text-muted">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
