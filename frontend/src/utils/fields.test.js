import { describe, it, expect } from 'vitest';
import { userView, eventView, matchView, connectionView, questionView, netSessionView, initials } from './fields';

describe('view-model mappers', () => {
  it('normalises users with aliases and mixed skill shapes', () => {
    const u = userView({ _id: 'u1', fullName: 'Ada Lovelace', skills: ['js', { name: 'react' }], avatar: { url: 'http://x/a.png' } });
    expect(u.id).toBe('u1'); expect(u.name).toBe('Ada Lovelace'); expect(u.skills).toEqual(['js', 'react']); expect(u.avatar).toBe('http://x/a.png');
  });
  it('maps events', () => {
    const e = eventView({ _id: 'e1', title: 'Conf', startDate: '2026-01-01', status: 'Published', organizer: { _id: 'o1', name: 'Org' } });
    expect(e.id).toBe('e1'); expect(e.status).toBe('published'); expect(e.organizerId).toBe('o1');
  });
  it('shows a match score ONLY when the backend provides one', () => {
    expect(matchView({ _id: 'u', name: 'A' }).score).toBeUndefined();
    expect(matchView({ user: { _id: 'u', name: 'A' }, matchPercentage: 87.4 }).score).toBe(87);
    expect(matchView({ user: { _id: 'u', name: 'A' }, score: 0.5 }).score).toBe(50);
  });
  it('derives direction and counterpart for connections', () => {
    const c = connectionView({ _id: 'c1', status: 'pending', requester: { _id: 'me', name: 'Me' }, recipient: { _id: 'you', name: 'You' } }, 'me');
    expect(c.outgoing).toBe(true); expect(c.user.name).toBe('You');
    const d = connectionView({ _id: 'c2', requester: { _id: 'you', name: 'You' }, recipient: { _id: 'me' } }, 'me');
    expect(d.outgoing).toBe(false); expect(d.user.name).toBe('You');
  });
  it('maps questions with vote arrays or counts', () => {
    expect(questionView({ _id: 'q', content: 'Hi', upvotes: ['me', 'x'] }, 'me')).toEqual(expect.objectContaining({ votes: 2, hasUpvoted: true }));
    expect(questionView({ _id: 'q', question: 'Hi', upvotes: 3 }, 'me').votes).toBe(3);
  });
  it('maps speed-networking sessions to Jitsi inputs', () => {
    const s = netSessionView({ _id: 's', roomName: 'room-1', jwt: 't', durationMinutes: 5 });
    expect(s.room).toBe('room-1'); expect(s.jwt).toBe('t'); expect(s.durationSeconds).toBe(300);
    expect(netSessionView(null)).toBeNull();
  });
  it('builds initials', () => { expect(initials('ada lovelace king')).toBe('AL'); expect(initials('')).toBe('?'); });
});
