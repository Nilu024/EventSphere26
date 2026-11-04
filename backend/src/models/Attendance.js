import mongoose from 'mongoose';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUSES } from '../constants/enums.js';
import { applyJSON } from '../utils/modelHelpers.js';

const attendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: Date,
    attendanceStatus: { type: String, enum: ATTENDANCE_STATUSES, default: ATTENDANCE_STATUS.PRESENT },
    markedBy: { type: String, enum: ['self', 'organizer'], default: 'self' },
    markedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });
attendanceSchema.index({ participant: 1 });
applyJSON(attendanceSchema);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
