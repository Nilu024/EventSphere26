// Local demo data. Usage: npm run seed   (refuses to run in production)
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { hashPassword } from '../src/services/authService.js';
import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { Session } from '../src/models/Session.js';
import { Speaker } from '../src/models/Speaker.js';
import { EventRegistration } from '../src/models/EventRegistration.js';
import { Connection } from '../src/models/Connection.js';
import { Question } from '../src/models/Question.js';

if (env.isProd) { console.error('Refusing to seed in production'); process.exit(1); }

const DEMO_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const day = (n, h = 0) => new Date(Date.now() + n * 86400000 + h * 3600000);

await connectDB();
await Promise.all([User, Event, Session, Speaker, EventRegistration, Connection, Question].map((m) => m.deleteMany({})));

const passwordHash = await hashPassword(DEMO_PASSWORD);
const mk = (name, email, role, extra = {}) => ({ name, email, role, passwordHash, ...extra });

const [admin, organizer] = await User.create([
  mk('Ada Admin', 'admin@eventsphere.test', 'admin'),
  mk('Olivia Organizer', 'organizer@eventsphere.test', 'organizer', { company: 'EventSphere Inc.' }),
]);
const participants = await User.create([
  mk('Priya Patel', 'priya@eventsphere.test', 'participant', { designation: 'Backend Engineer', company: 'Acme', skills: ['java', 'react', 'mongodb'], interests: ['backend development', 'cloud computing'] }),
  mk('Rahul Sharma', 'rahul@eventsphere.test', 'participant', { designation: 'Full-stack Developer', company: 'Globex', skills: ['java', 'react', 'node.js'], interests: ['backend development', 'ai'] }),
  mk('Meera Iyer', 'meera@eventsphere.test', 'participant', { designation: 'Data Scientist', company: 'Initech', skills: ['python', 'machine learning'], interests: ['ai', 'cloud computing'] }),
  mk('Arjun Rao', 'arjun@eventsphere.test', 'participant', { designation: 'DevOps Engineer', company: 'Umbrella', skills: ['docker', 'kubernetes', 'node.js'], interests: ['cloud computing', 'security'] }),
  mk('Sara Khan', 'sara@eventsphere.test', 'participant', { designation: 'Product Designer', company: 'Hooli', skills: ['figma', 'react'], interests: ['ux', 'ai'] }),
  mk('Vikram Singh', 'vikram@eventsphere.test', 'participant', { designation: 'Security Analyst', company: 'Stark', skills: ['security', 'python'], interests: ['security', 'cloud computing'] }),
]);

const live = await Event.create({
  title: 'EventSphere Tech Summit', description: 'A two-day virtual conference on cloud, AI and backend engineering.',
  category: 'conference', organizer: organizer._id, startDate: day(0, -1), endDate: day(2), timezone: 'Asia/Kolkata',
  capacity: 200, status: 'published', registeredCount: participants.length,
});
await Event.create({
  title: 'Draft: Security Workshop', description: 'Hands-on application security workshop (draft).',
  category: 'workshop', organizer: organizer._id, startDate: day(14), endDate: day(14, 4), capacity: 40, status: 'draft',
});

const speaker = await Speaker.create({ event: live._id, name: 'Dr. Grace Hopper', designation: 'Chief Scientist', organization: 'Navy Labs', expertise: ['compilers', 'cloud computing'], addedBy: organizer._id });
await Session.create([
  { event: live._id, title: 'Opening Keynote', speaker: speaker._id, startTime: day(0), endTime: day(0, 1) },
  { event: live._id, title: 'Scaling Node.js with MongoDB', startTime: day(0, 2), endTime: day(0, 3) },
]);
await EventRegistration.create(participants.map((p) => ({ event: live._id, participant: p._id })));

const [priya, rahul, meera] = participants;
await Connection.create({ pairKey: Connection.pairKey(priya._id, rahul._id), requester: priya._id, recipient: rahul._id, status: 'accepted', respondedAt: new Date() });
await Connection.create({ pairKey: Connection.pairKey(priya._id, meera._id), requester: meera._id, recipient: priya._id, status: 'pending' });
await Question.create([
  { event: live._id, askedBy: priya._id, questionText: 'How do you design for horizontal scaling?', upvotes: [rahul._id, meera._id] },
  { event: live._id, askedBy: rahul._id, questionText: 'Is MongoDB a good fit for chat history?', upvotes: [priya._id] },
]);

console.log(`Seeded. Password for all demo accounts: ${DEMO_PASSWORD}`);
console.log(' admin@eventsphere.test | organizer@eventsphere.test | priya@ / rahul@ / meera@ / arjun@ / sara@ / vikram@eventsphere.test');
console.log(` Live event id: ${live.id}`);
await mongoose.disconnect();
