import mongoose from 'mongoose';
import { REGISTRATION_STATUS, REGISTRATION_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationDate: { type: Date, default: Date.now },
    status: { type: String, enum: REGISTRATION_STATUSES, default: REGISTRATION_STATUS.REGISTERED },
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, participant: 1 }, { unique: true });
registrationSchema.index({ participant: 1, status: 1 });
registrationSchema.index({ event: 1, status: 1 });
applyJSON(registrationSchema);

export const EventRegistration = mongoose.model('EventRegistration', registrationSchema);
