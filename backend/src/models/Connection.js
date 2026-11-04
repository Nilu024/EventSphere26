import mongoose from 'mongoose';
import { CONNECTION_STATUS, CONNECTION_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const connectionSchema = new mongoose.Schema(
  {
    // Order-independent key "<smallerId>_<largerId>": exactly one connection document per user pair.
    pairKey: { type: String, required: true, unique: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: CONNECTION_STATUSES, default: CONNECTION_STATUS.PENDING },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: Date,
    removedAt: Date,
  },
  { timestamps: true }
);

connectionSchema.statics.pairKey = (a, b) => [String(a), String(b)].sort().join('_');

connectionSchema.pre('validate', function noSelf(next) {
  if (this.requester && this.recipient && this.requester.equals(this.recipient)) {
    this.invalidate('recipient', 'Cannot connect with yourself');
  }
  next();
});

connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });
applyJSON(connectionSchema, ['pairKey']);

export const Connection = mongoose.model('Connection', connectionSchema);
