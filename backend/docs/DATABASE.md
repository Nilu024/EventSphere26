# Database design (MongoDB / Mongoose)

All collections have `timestamps` unless noted. `id` is exposed in JSON (`_id`/`__v` hidden). ObjectId references are indicated `→`.

## users
`name`, `email` (unique, lowercase), `passwordHash` (select:false, never serialised), `role` (admin|organizer|participant), `profileImage`, `bio`, `designation`, `company`,
`skills[]`, `interests[]` (normalised lower-case, de-duplicated, ≤30), `experience`, `socialLinks{linkedin,github,twitter,website}`, `isActive`,
`tokenVersion` (select:false), `passwordResetToken`/`passwordResetExpires` (select:false, token stored SHA-256 hashed), `lastLoginAt`.
Indexes: unique `email`; `{role,isActive}`; `skills`; `interests`.

## events
`title`, `description`, `category` (enum), `organizer`→users, `startDate`, `endDate`, `timezone`, `mode` ('virtual'), `meetingLink`, `bannerImage`, `capacity`,
`registeredCount` (atomic seat counter), `status` (draft|published|cancelled|completed), `registrationDeadline`. Virtual `availableSeats`.
Indexes: `{organizer,status}`, `{startDate,status}`, `{category,status}`.

## sessions
`event`→events, `title`, `description`, `speaker`→speakers (nullable), `startTime`, `endTime`, `meetingLink`, `status` (scheduled|live|completed|cancelled). Index `{event,startTime}`.

## speakers
`event`→events (added; see README), `user`→users (optional), `name`, `designation`, `organization`, `biography`, `profileImage`, `expertise[]`, `socialLinks`, `addedBy`→users. Index `{event,name}`.

## eventregistrations
`event`→events, `participant`→users, `registrationDate`, `status` (registered|cancelled|attended).
Indexes: **unique `{event,participant}`**, `{participant,status}`, `{event,status}`.

## connections
`pairKey` (unique, `"<minId>_<maxId>"`), `requester`→users, `recipient`→users, `status` (pending|accepted|rejected|cancelled|blocked), `blockedBy`, `respondedAt`, `removedAt`.
Indexes: **unique `pairKey`**, `{requester,status}`, `{recipient,status}`.
State machine: none→pending; pending→accepted/rejected (recipient), pending→cancelled (requester); rejected/cancelled→pending (re-request); accepted→cancelled (remove); any→blocked (by blocker), blocked→cancelled (blocker only).

## messages
`sender`, `receiver`→users, `connection`→connections, `content` (≤2000), `messageType` ('text'), `editedAt`; `createdAt` only.
Indexes: `{sender,receiver,createdAt:-1}`, `{connection,createdAt:-1}`.

## questions
`event`→events, `session`→sessions (optional), `askedBy`→users, `questionText` (5-500), `upvotes[]`→users (voters; one per user enforced atomically), `isApproved`, `isPinned`, `isHidden`.
Indexes: `{event,createdAt:-1}`, `{event,session}`, `{askedBy}`.

## networkingsessions
`event`, `participantOne`, `participantTwo`, `participants[]` (derived), `roomId` (unique), `scheduledStart`, `actualStart`, `actualEnd`, `duration` (seconds), `status` (waiting|active|completed|cancelled), `endReason`, `isOpen`.
Indexes: `{event,status}`, `{participants,createdAt:-1}`, **unique `{participants}` partial `{isOpen:true}`** (a user cannot be in two open sessions), unique `roomId`.

## notifications
`recipient`→users, `type` (enum), `title`, `message`, `relatedEntityId`, `isRead`; `createdAt` only. Indexes: `{recipient,createdAt:-1}`, `{recipient,isRead}`.

## attendances
`event`, `participant`, `checkInTime`, `checkOutTime`, `attendanceStatus` (present|checked_out), `markedBy` (self|organizer), `markedByUser`. Indexes: **unique `{event,participant}`**, `{participant}`.

## Relationships
users 1—* events (organizer) · events 1—* sessions / speakers / questions / registrations / attendances / networkingsessions · speakers 1—* sessions · users *—* users via connections · connections 1—* messages.

## Consistency mechanisms
- Seats: conditional `$inc` on `events.registeredCount` (`registeredCount < capacity`) + unique registration index.
- Votes: `updateOne({_id, upvotes:{$ne:user}}, {$addToSet})`.
- Connection transitions: atomic `findOneAndUpdate` filtered on the expected current status and actor.
- Networking: global mutex + partial unique index; `finishSession` is idempotent (filters `isOpen:true`).
- No multi-document transactions are used, so a standalone MongoDB works (no replica set required).
