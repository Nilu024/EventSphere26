import mongoose from 'mongoose';
import { NETWORKING_STATUS, NETWORKING_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const networkingSessionSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participantOne: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participantTwo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Derived [participantOne, participantTwo]; powers the "one open session per user" unique index.
    participants: { type: [mongoose.Schema.Types.ObjectId], required: true },
    roomId: { type: String, required: true, unique: true },
    scheduledStart: { type: Date, required: true },
    actualStart: Date,
    actualEnd: Date,
    duration: { type: Number, required: true }, // seconds (server-authoritative)
    status: { type: String, enum: NETWORKING_STATUSES, default: NETWORKING_STATUS.WAITING },
    endReason: { type: String, enum: ['time_elapsed', 'ended_early', 'participant_disconnected', 'server_recovery', null], default: null },
    // true while status is waiting|active; false once finished.
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

networkingSessionSchema.index({ event: 1, status: 1 });
networkingSessionSchema.index({ participants: 1, createdAt: -1 });
// Database-level guarantee: a user can appear in at most one open session.
networkingSessionSchema.index({ participants: 1 }, { unique: true, partialFilterExpression: { isOpen: true } });

applyJSON(networkingSessionSchema, ['participants']);

export const NetworkingSession = mongoose.model('NetworkingSession', networkingSessionSchema);
