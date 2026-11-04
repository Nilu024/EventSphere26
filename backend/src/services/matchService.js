import { User } from '../models/User.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { ROLES } from '../constants/roles.js';
import { ACTIVE_REGISTRATION_STATUSES, CONNECTION_STATUS as S } from '../constants/enums.js';
import { normalizeList } from '../utils/normalize.js';
import { jaccardPercent, weightedScore, round2 } from '../utils/similarity.js';
import { relatedUserIds, isBlockedBetween, getRelationship } from './connectionService.js';
import { assertEventMember } from './accessService.js';

const TOP_N = 5;
const CANDIDATE_LIMIT = 1000;
const CARD_FIELDS = 'name profileImage designation company bio skills interests';

/** Pure scoring of two profiles. S = 0.60 * K + 0.40 * I (K, I are Jaccard percentages). */
export function scoreProfiles(me, other) {
  const mySkills = normalizeList(me.skills);
  const myInterests = normalizeList(me.interests);
  const theirSkills = normalizeList(other.skills);
  const theirInterests = normalizeList(other.interests);
  const skillSimilarity = jaccardPercent(mySkills, theirSkills);
  const interestSimilarity = jaccardPercent(myInterests, theirInterests);
  const theirSkillSet = new Set(theirSkills);
  const theirInterestSet = new Set(theirInterests);
  return {
    score: round2(weightedScore(skillSimilarity, interestSimilarity)),
    skillSimilarity: round2(skillSimilarity),
    interestSimilarity: round2(interestSimilarity),
    sharedSkills: mySkills.filter((s) => theirSkillSet.has(s)),
    sharedInterests: myInterests.filter((i) => theirInterestSet.has(i)),
  };
}

/** Ranks candidates by score (ties: skill similarity, then name) and returns the top N with score > 0. */
export function rankCandidates(me, candidates, limit = TOP_N) {
  return candidates
    .filter((c) => String(c._id) !== String(me._id)) // never recommend the current user
    .map((c) => ({ user: c, ...scoreProfiles(me, c) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.skillSimilarity - a.skillSimilarity || String(a.user.name).localeCompare(String(b.user.name)))
    .slice(0, limit);
}

async function eventParticipantIds(eventId) {
  return EventRegistration.find({ event: eventId, status: { $in: ACTIVE_REGISTRATION_STATUSES } }).distinct('participant');
}

export async function getRecommendations(user, { eventId } = {}) {
  const mySkills = normalizeList(user.skills);
  const myInterests = normalizeList(user.interests);
  if (!mySkills.length && !myInterests.length) return [];

  // Exclude: self, blocked (either direction), already connected, pending requests.
  const excluded = [String(user._id), ...(await relatedUserIds(user._id, [S.BLOCKED, S.ACCEPTED, S.PENDING]))];

  const idFilter = { $nin: excluded };
  if (eventId) {
    await assertEventMember(eventId, user); // requester must belong to the event
    idFilter.$in = await eventParticipantIds(eventId);
  }
  const or = [];
  if (mySkills.length) or.push({ skills: { $in: mySkills } });
  if (myInterests.length) or.push({ interests: { $in: myInterests } });

  const candidates = await User.find({ role: ROLES.PARTICIPANT, isActive: true, _id: idFilter, $or: or })
    .select(CARD_FIELDS).limit(CANDIDATE_LIMIT).lean();

  return rankCandidates(user, candidates).map((r) => ({
    user: { id: r.user._id, name: r.user.name, profileImage: r.user.profileImage, designation: r.user.designation, company: r.user.company, bio: r.user.bio, skills: r.user.skills, interests: r.user.interests },
    score: r.score,
    skillSimilarity: r.skillSimilarity,
    interestSimilarity: r.interestSimilarity,
    sharedSkills: r.sharedSkills,
    sharedInterests: r.sharedInterests,
  }));
}

export async function getRecommendationDetail(user, targetId, { eventId } = {}) {
  if (String(targetId) === String(user._id)) throw ApiError.badRequest('This is your own profile');
  const target = await User.findOne({ _id: targetId, role: ROLES.PARTICIPANT, isActive: true }).select(CARD_FIELDS);
  if (!target || (await isBlockedBetween(user._id, target._id))) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  if (eventId) {
    await assertEventMember(eventId, user);
    const ids = (await eventParticipantIds(eventId)).map(String);
    if (!ids.includes(String(target._id))) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  }
  return {
    user: target,
    ...scoreProfiles(user, target),
    relationship: await getRelationship(user._id, target._id),
  };
}
