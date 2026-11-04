import mongoose from 'mongoose';
import { SESSION_STATUS, SESSION_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const sessionSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 3000 },
    speaker: { type: mongoose.Schema.Types.ObjectId, ref: 'Speaker', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: SESSION_STATUSES, default: SESSION_STATUS.SCHEDULED },
  },
  { timestamps: true }
);

sessionSchema.pre('validate', function checkTimes(next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'endTime must be after startTime');
  }
  next();
});

sessionSchema.index({ event: 1, startTime: 1 });
applyJSON(sessionSchema);

export const Session = mongoose.model('Session', sessionSchema);
