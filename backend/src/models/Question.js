import mongoose from 'mongoose';
import { applyJSON } from '../utils/modelHelpers.js';

const questionSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionText: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isApproved: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

questionSchema.index({ event: 1, createdAt: -1 });
questionSchema.index({ event: 1, session: 1 });
questionSchema.index({ askedBy: 1 });
applyJSON(questionSchema);

export const Question = mongoose.model('Question', questionSchema);
