/**
 * View-model mappers: the ONE place where backend field names are guessed.
 * Each mapper accepts the most common aliases so a slightly different schema still renders.
 * Anything not documented is labelled ASSUMPTION in README → "Backend assumptions".
 */
export const pick = (obj, keys, fallback = undefined) => {
  if (!obj) return fallback;
  for (const k of keys) { const v = obj[k]; if (v !== undefined && v !== null && v !== '') return v; }
  return fallback;
};
export const idOf = (e) => (e && typeof e === 'object' ? (e._id ?? e.id ?? e.userId ?? e.eventId) : e);
const imageUrl = (v) => (v && typeof v === 'object' ? v.url || v.secure_url : v);
const names = (arr) => (Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s : s?.name || s?.label || s?.title)).filter(Boolean) : []);

export const userView = (u) => {
  if (!u || typeof u !== 'object') return { id: u, name: 'Unknown user', skills: [], interests: [] };
  const profile = u.profile || {};
  const first = pick(u, ['firstName']);
  return {
    id: idOf(u),
    name: pick(u, ['name', 'fullName'], first ? `${first} ${u.lastName || ''}`.trim() : 'Unknown user'),
    email: u.email,
    role: u.role,
    status: pick(u, ['status'], u.isActive === false ? 'inactive' : u.isBlocked ? 'blocked' : 'active'),
    avatar: imageUrl(pick(u, ['avatar', 'profilePicture', 'avatarUrl', 'profileImage', 'image', 'photo'])) || imageUrl(profile.avatar),
    headline: pick(u, ['headline', 'jobTitle', 'designation', 'title'], profile.headline),
    company: pick(u, ['company', 'organization'], profile.company),
    location: pick(u, ['location', 'city'], profile.location),
    bio: pick(u, ['bio', 'about', 'summary'], profile.bio),
    skills: names(pick(u, ['skills'], profile.skills)),
    interests: names(pick(u, ['interests'], profile.interests)),
    createdAt: u.createdAt,
  };
};

export const eventView = (e) => {
  if (!e || typeof e !== 'object') return { id: e };
  const org = pick(e, ['organizer', 'createdBy', 'organizerId']);
  return {
    id: idOf(e),
    title: pick(e, ['title', 'name'], 'Untitled event'),
    description: pick(e, ['description', 'about'], ''),
    status: String(pick(e, ['status'], 'draft')).toLowerCase(),
    start: pick(e, ['startDate', 'startTime', 'startsAt', 'date']),
    end: pick(e, ['endDate', 'endTime', 'endsAt']),
    banner: imageUrl(pick(e, ['banner', 'bannerUrl', 'bannerImage', 'image', 'coverImage'])),
    category: pick(e, ['category', 'type']),
    location: pick(e, ['location', 'venue', 'mode']),
    capacity: pick(e, ['capacity', 'maxParticipants', 'maxAttendees']),
    registeredCount: pick(e, ['registeredCount', 'registrationsCount', 'registrationCount', 'attendeesCount', 'participantsCount']),
    organizerId: typeof org === 'object' ? idOf(org) : org,
    organizerName: typeof org === 'object' ? org.name : undefined,
    raw: e,
  };
};

export const sessionView = (s) => ({
  id: idOf(s), title: pick(s, ['title', 'name'], 'Untitled session'), description: s?.description || '',
  start: pick(s, ['startTime', 'startDate', 'startsAt']), end: pick(s, ['endTime', 'endDate', 'endsAt']),
  speakers: names(s?.speakers), raw: s,
});

export const speakerView = (s) => ({
  id: idOf(s), name: pick(s, ['name', 'fullName'], 'Speaker'), designation: pick(s, ['designation', 'title', 'jobTitle']),
  company: pick(s, ['company', 'organization']), bio: s?.bio || '', image: imageUrl(pick(s, ['image', 'photo', 'avatar', 'imageUrl'])), raw: s,
});

export const registrationView = (r) => {
  const ev = r?.event && typeof r.event === 'object' ? r.event : null;
  const user = r?.user || r?.participant;
  return {
    id: idOf(r), status: String(pick(r, ['status'], 'registered')).toLowerCase(),
    eventId: ev ? idOf(ev) : pick(r, ['eventId', 'event']),
    event: ev ? eventView(ev) : null,
    user: user && typeof user === 'object' ? userView(user) : null,
    userId: user && typeof user === 'object' ? idOf(user) : pick(r, ['userId', 'user']),
    createdAt: r?.createdAt, raw: r,
  };
};

/** Recommendation: flat user, or `{ user, score, commonSkills }`. Score shown ONLY if the backend sends it. */
export const matchView = (m) => {
  const u = m?.user && typeof m.user === 'object' ? m.user : m;
  const raw = pick(m, ['matchPercentage', 'compatibility', 'compatibilityScore', 'matchScore', 'score', 'percentage']);
  let score = raw === undefined ? undefined : Number(raw);
  if (score !== undefined && Number.isNaN(score)) score = undefined;
  if (score !== undefined && score <= 1 && score > 0) score = score * 100;
  return {
    ...userView(u),
    score: score === undefined ? undefined : Math.round(score),
    commonSkills: names(pick(m, ['commonSkills', 'sharedSkills', 'matchingSkills'], [])),
    commonInterests: names(pick(m, ['commonInterests', 'sharedInterests', 'matchingInterests'], [])),
  };
};

/** Connection: figures out "the other person" and direction relative to the current user. */
export const connectionView = (c, myId) => {
  const a = pick(c, ['requester', 'sender', 'from', 'requesterId', 'senderId']);
  const b = pick(c, ['recipient', 'receiver', 'to', 'recipientId', 'receiverId']);
  const aId = idOf(a); const bId = idOf(b);
  const direct = pick(c, ['user', 'otherUser', 'connectedUser', 'connection']);
  let other = direct;
  let outgoing = false;
  if (!other) {
    outgoing = myId && String(aId) === String(myId);
    other = outgoing ? b : a;
  }
  return { id: idOf(c), status: String(pick(c, ['status'], 'accepted')).toLowerCase(), user: userView(other), outgoing, message: c?.message, createdAt: c?.createdAt, raw: c };
};

export const questionView = (q, myId) => {
  const votes = pick(q, ['upvotes', 'votes', 'upvoteCount', 'votesCount'], 0);
  const voters = Array.isArray(votes) ? votes : null;
  const count = voters ? voters.length : Number(votes) || 0;
  const hasVoted = pick(q, ['hasUpvoted', 'upvoted', 'isUpvoted', 'hasVoted']) ?? (voters && myId ? voters.some((v) => String(idOf(v)) === String(myId)) : false);
  const author = pick(q, ['askedBy', 'author', 'user', 'createdBy']);
  return {
    id: idOf(q), content: pick(q, ['content', 'question', 'text'], ''), status: String(pick(q, ['status'], 'pending')).toLowerCase(),
    votes: count, hasUpvoted: Boolean(hasVoted), authorName: typeof author === 'object' ? author?.name : undefined,
    anonymous: Boolean(q?.isAnonymous), createdAt: q?.createdAt, raw: q,
  };
};

export const messageView = (m, myId) => {
  const sender = pick(m, ['sender', 'from', 'senderId']);
  const sid = idOf(sender);
  return { id: idOf(m), content: pick(m, ['content', 'message', 'text'], ''), mine: Boolean(myId) && String(sid) === String(myId), createdAt: m?.createdAt, read: pick(m, ['read', 'isRead']) };
};

export const notificationView = (n) => ({
  id: idOf(n), title: pick(n, ['title', 'type'], 'Notification'), message: pick(n, ['message', 'content', 'body'], ''),
  read: Boolean(pick(n, ['read', 'isRead'], false)), createdAt: n?.createdAt, link: n?.link || n?.url,
});

/** Speed-networking session → Jitsi inputs. Room/JWT field names are ASSUMPTIONS; see README. */
export const netSessionView = (s) => {
  if (!s) return null;
  const partner = pick(s, ['partner', 'matchedUser', 'otherUser', 'peer']) || (Array.isArray(s.participants) ? s.participants.find((p) => p && typeof p === 'object') : undefined);
  return {
    id: idOf(s), status: String(pick(s, ['status'], 'active')).toLowerCase(),
    room: pick(s, ['roomName', 'room', 'jitsiRoom', 'meetingRoom', 'roomId', 'meetingId']),
    meetingUrl: pick(s, ['meetingUrl', 'meetingLink', 'url']),
    jwt: pick(s, ['jwt', 'jitsiToken', 'token']),
    partner: partner ? userView(partner) : null,
    startedAt: pick(s, ['startedAt', 'startTime', 'createdAt']),
    endsAt: pick(s, ['endsAt', 'endTime', 'expiresAt']),
    durationSeconds: pick(s, ['durationSeconds']) ?? (pick(s, ['durationMinutes', 'duration']) ? Number(pick(s, ['durationMinutes', 'duration'])) * 60 : undefined),
    raw: s,
  };
};

export const humanize = (key) => String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
