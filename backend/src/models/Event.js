import mongoose from 'mongoose';
import { EVENT_CATEGORIES, EVENT_STATUS, EVENT_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    mode: { type: String, enum: ['virtual'], default: 'virtual' },
    meetingLink: { type: String, trim: true, maxlength: 500 },
    bannerImage: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1, default: 100 },
    // Atomic seat counter (registered + attended). Guarantees capacity is never oversold.
    registeredCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: EVENT_STATUS.DRAFT },
    registrationDeadline: Date,
  },
  { timestamps: true }
);

eventSchema.virtual('availableSeats').get(function availableSeats() {
  return Math.max(0, this.capacity - (this.registeredCount || 0));
});

eventSchema.pre('validate', function checkDates(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'endDate must be after startDate');
  }
  next();
});

eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });

applyJSON(eventSchema);

export const Event = mongoose.model('Event', eventSchema);
